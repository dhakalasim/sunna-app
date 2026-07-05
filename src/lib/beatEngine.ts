import * as Tone from "tone";
import type { GenrePreset } from "./genrePresets";

const MIN_DURATION = 5;
const MAX_DURATION = 600; // 10 minutes cap, keeps memory use reasonable

const LOOP_CYCLE = [true, false, false, false]; // accent (crash/fill) every 4th phrase repeat
const FADE_IN_SECONDS = 0.02;
const FADE_OUT_SECONDS = 1.0;

function clampDuration(seconds: number): number {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, seconds));
}

function transpose(note: string, semitones: number): string {
  return Tone.Frequency(note).transpose(semitones).toNote();
}

/**
 * Synthesizes exactly one harmonic cycle (one pass through the genre's chord
 * progression) offline. This is the only step that actually schedules Tone.js
 * events, so its cost is bounded by the pattern length, not the requested
 * beat duration — a 5-minute beat renders exactly as fast as a 10-second one.
 */
async function renderUnit(genre: GenrePreset, accent: boolean): Promise<AudioBuffer> {
  const bars = genre.chordProgression.length;
  const barSeconds = (60 / genre.bpm) * 4;
  const unitSeconds = barSeconds * bars;
  const stepsTotal = bars * 16;

  const toneBuffer = await Tone.Offline(async () => {
    const transport = Tone.getTransport();
    transport.bpm.value = genre.bpm;
    transport.swing = genre.swing;
    transport.swingSubdivision = "16n";

    // ---- master bus: gain (anti-click) -> compressor -> eq -> limiter -> out ----
    const masterGain = new Tone.Gain(0).toDestination();
    masterGain.gain.rampTo(1, 0.03);

    const limiter = new Tone.Limiter(-0.8).connect(masterGain);
    const eq = new Tone.EQ3({ low: 1, mid: 0, high: 1.5 }).connect(limiter);
    const compressor = new Tone.Compressor({
      threshold: -18,
      ratio: 3,
      attack: 0.003,
      release: 0.15,
    }).connect(eq);

    const lowpass = new Tone.Filter({
      type: "lowpass",
      frequency: genre.mix.filterCutoff,
      rolloff: -12,
    }).connect(compressor);

    const reverb = new Tone.Reverb({
      decay: genre.mix.reverbDecay,
      wet: 1,
      preDelay: 0.01,
    }).connect(lowpass);
    await reverb.ready;
    const reverbSend = new Tone.Gain(genre.mix.reverbWet).connect(reverb);

    const dryBus = new Tone.Gain(1).connect(lowpass);
    dryBus.connect(reverbSend);

    // ---- drum voices ----
    const kickBoost = new Tone.Gain(1.1).connect(dryBus);
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.045,
      octaves: 5,
      envelope: { attack: 0.001, decay: 0.35, sustain: 0.001, release: 0.3 },
      oscillator: { type: "sine" },
    }).connect(kickBoost);
    const kickNote = genre.id === "rap" ? "C1" : "C2";

    const snareFilter = new Tone.Filter({ type: "bandpass", frequency: 1800, Q: 0.8 }).connect(
      dryBus,
    );
    const snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
    }).connect(snareFilter);
    const snareBody = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.05 },
    }).connect(snareFilter);

    const closedHatFilter = new Tone.Filter({ type: "highpass", frequency: 7500 }).connect(
      dryBus,
    );
    const closedHat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.045, sustain: 0 },
    }).connect(closedHatFilter);
    const openHat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.28, sustain: 0 },
    }).connect(closedHatFilter);

    const percSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.12, release: 0.05 },
      harmonicity: 5.1,
      modulationIndex: 16,
      resonance: 2000,
      octaves: 0.8,
    }).connect(dryBus);
    percSynth.volume.value = -16;

    const crash = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 1.4, release: 0.3 },
      harmonicity: 4.2,
      modulationIndex: 12,
      resonance: 3500,
      octaves: 1.2,
    }).connect(dryBus);
    crash.volume.value = -10;

    // ---- bass ----
    const bassDrive = new Tone.Distortion(genre.mix.drive * 0.6).connect(dryBus);
    const bassFilter = new Tone.Filter({ type: "lowpass", frequency: 900 }).connect(bassDrive);
    const bass = new Tone.MonoSynth({
      oscillator: { type: genre.bassStyle === "808slide" ? "sine" : "sawtooth" },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.3 },
      filterEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.4, baseFrequency: 200, octaves: 2 },
      portamento: genre.bassStyle === "808slide" || genre.bassStyle === "walking" ? 0.06 : 0,
    }).connect(bassFilter);
    bass.volume.value = -4;

    // ---- lead / chords ----
    const leadDrive = new Tone.Distortion(genre.mix.drive).connect(dryBus);
    const leadWidener = new Tone.StereoWidener(0.4).connect(leadDrive);

    let leadOscType = "triangle";
    if (genre.leadStyle === "powerChordChug") leadOscType = "sawtooth";
    if (genre.leadStyle === "supersaw") leadOscType = "fatsawtooth";
    if (genre.leadStyle === "pluck") leadOscType = "triangle";
    if (genre.leadStyle === "keysPad" || genre.leadStyle === "jazzComp") leadOscType = "sine";

    const lead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: leadOscType } as Tone.SynthOptions["oscillator"],
      envelope: {
        attack: genre.leadStyle === "keysPad" ? 0.08 : 0.005,
        decay: 0.15,
        sustain: genre.leadStyle === "keysPad" || genre.leadStyle === "supersaw" ? 0.6 : 0.1,
        release: genre.leadStyle === "keysPad" ? 0.8 : 0.2,
      },
    }).connect(leadWidener);
    lead.volume.value = genre.leadStyle === "powerChordChug" ? -6 : -9;

    // vinyl-noise texture for lo-fi
    let vinyl: Tone.Noise | undefined;
    if (genre.mix.vinylNoise) {
      const vinylGain = new Tone.Gain(0.035).connect(dryBus);
      vinyl = new Tone.Noise("pink").connect(vinylGain);
    }

    const bassSteps: Record<string, number[]> = {
      eighthPulse: [0, 2, 4, 6, 8, 10, 12, 14],
      "808slide": [0, 6, 8, 11],
      syncopated: [0, 3, 7, 10, 14],
      walking: [0, 4, 8, 12],
      sustainedRoot: [0],
      fourOnFloor: [0, 4, 8, 12],
    };
    const leadSteps: Record<string, number[]> = {
      powerChordChug: [0, 2, 4, 6, 8, 10, 12, 14],
      pluck: [0, 4, 8, 12],
      supersaw: [0, 8],
      keysPad: [0],
      jazzComp: [4, 10, 13],
      none: [],
    };

    let walkIndex = 0;
    let stepCounter = 0;
    const repeatId = transport.scheduleRepeat((time) => {
      const stepInBar = stepCounter % 16;
      const barIndex = Math.floor(stepCounter / 16);
      const chord = genre.chordProgression[barIndex % genre.chordProgression.length];
      const isPhraseStart = accent && barIndex === 0 && stepInBar === 0;
      const jitter = stepInBar % 2 === 1 ? (Math.random() - 0.5) * 0.004 : 0;
      const t = time + jitter;

      const d = genre.drums;
      if (d.kick[stepInBar] > 0) kick.triggerAttackRelease(kickNote, "8n", t, d.kick[stepInBar]);
      if (d.snare[stepInBar] > 0) {
        snare.triggerAttackRelease("16n", t, d.snare[stepInBar]);
        snareBody.triggerAttackRelease("A2", "16n", t, d.snare[stepInBar] * 0.6);
      }
      if (d.closedHat[stepInBar] > 0) closedHat.triggerAttackRelease("32n", t, d.closedHat[stepInBar]);
      if (d.openHat[stepInBar] > 0) openHat.triggerAttackRelease("8n", t, d.openHat[stepInBar]);
      if (d.perc && d.perc[stepInBar] > 0) percSynth.triggerAttackRelease("32n", t, d.perc[stepInBar]);
      if (d.crashOnPhrase && isPhraseStart) crash.triggerAttackRelease("1n", t, 0.55);

      if (bassSteps[genre.bassStyle].includes(stepInBar)) {
        let note: string;
        if (genre.bassStyle === "walking") {
          const tone = chord[walkIndex % chord.length];
          note = transpose(tone, -12);
          walkIndex++;
        } else {
          note = transpose(chord[0], -12);
        }
        const dur =
          genre.bassStyle === "sustainedRoot"
            ? "1n"
            : genre.bassStyle === "808slide"
              ? "4n"
              : "8n";
        bass.triggerAttackRelease(note, dur, t, 0.85);
      }

      if (leadSteps[genre.leadStyle].includes(stepInBar)) {
        if (genre.leadStyle === "pluck") {
          const note = chord[stepInBar % chord.length];
          lead.triggerAttackRelease(note, "8n", t, 0.55);
        } else if (genre.leadStyle === "keysPad") {
          lead.triggerAttackRelease(chord, "1n", t, 0.4);
        } else if (genre.leadStyle === "supersaw") {
          lead.triggerAttackRelease(chord, "2n", t, 0.5);
        } else if (genre.leadStyle === "jazzComp") {
          lead.triggerAttackRelease(chord, "8n", t, 0.35);
        } else if (genre.leadStyle === "powerChordChug") {
          lead.triggerAttackRelease(chord, "16n", t, 0.6);
        }
      }

      stepCounter++;
      if (stepCounter >= stepsTotal) transport.clear(repeatId);
    }, "16n", 0);

    vinyl?.start(0);
    transport.start(0);
  }, unitSeconds);

  const audioBuffer = toneBuffer.get();
  if (!audioBuffer) throw new Error("Beat rendering failed to produce audio.");
  return audioBuffer;
}

/** Tiles two alternating unit buffers back-to-back to fill the target duration. */
function tileToLength(units: AudioBuffer[], totalSeconds: number): AudioBuffer {
  const sampleRate = units[0].sampleRate;
  const numChannels = units[0].numberOfChannels;
  const totalFrames = Math.round(totalSeconds * sampleRate);

  const out = new AudioBuffer({ length: totalFrames, numberOfChannels: numChannels, sampleRate });

  for (let ch = 0; ch < numChannels; ch++) {
    const dest = out.getChannelData(ch);
    let offset = 0;
    let cycle = 0;
    while (offset < totalFrames) {
      const src = units[cycle % units.length].getChannelData(ch);
      const copyLen = Math.min(src.length, totalFrames - offset);
      dest.set(src.subarray(0, copyLen), offset);
      offset += src.length;
      cycle++;
    }
  }

  return out;
}

function applyFades(buffer: AudioBuffer): void {
  const sampleRate = buffer.sampleRate;
  const fadeInSamples = Math.min(buffer.length, Math.round(FADE_IN_SECONDS * sampleRate));
  const fadeOutSamples = Math.min(buffer.length, Math.round(FADE_OUT_SECONDS * sampleRate));

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < fadeInSamples; i++) {
      data[i] *= i / fadeInSamples;
    }
    for (let i = 0; i < fadeOutSamples; i++) {
      const idx = buffer.length - 1 - i;
      data[idx] *= i / fadeOutSamples;
    }
  }
}

/** Renders a full genre-appropriate beat and returns a raw AudioBuffer. */
export async function renderBeat(
  genre: GenrePreset,
  durationSecondsRaw: number,
): Promise<AudioBuffer> {
  const durationSeconds = clampDuration(durationSecondsRaw);

  // Tone.Offline swaps a shared global audio context while its callback runs,
  // so two overlapping Offline renders cross-connect nodes between contexts.
  // These must run sequentially, not via Promise.all.
  const accented = await renderUnit(genre, true);
  const plain = await renderUnit(genre, false);
  const units = LOOP_CYCLE.map((accent) => (accent ? accented : plain));
  const tiled = tileToLength(units, durationSeconds);
  applyFades(tiled);
  return tiled;
}

export { MIN_DURATION, MAX_DURATION };
