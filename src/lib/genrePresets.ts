// Step arrays are 16 slots per bar (16th-note grid). Value = velocity (0-1), 0 = silent.
export type StepPattern = number[];

export type BassStyle =
  | "eighthPulse"
  | "808slide"
  | "syncopated"
  | "walking"
  | "sustainedRoot"
  | "fourOnFloor";

export type LeadStyle =
  | "powerChordChug"
  | "pluck"
  | "supersaw"
  | "keysPad"
  | "jazzComp"
  | "none";

export interface GenrePreset {
  id: string;
  label: string;
  bpm: number;
  swing: number; // 0 (straight) - 0.66 (heavy swing)
  rootNote: string; // e.g. "E2"
  chordProgression: string[][]; // each chord = array of note names, one chord per bar (cycled)
  drums: {
    kick: StepPattern;
    snare: StepPattern;
    closedHat: StepPattern;
    openHat: StepPattern;
    perc?: StepPattern;
    crashOnPhrase?: boolean;
  };
  bassStyle: BassStyle;
  leadStyle: LeadStyle;
  mix: {
    drive: number; // 0-1 distortion amount on lead/bass
    reverbWet: number; // 0-1
    reverbDecay: number; // seconds
    filterCutoff: number; // Hz, master tone shaping (lo-fi uses this heavily)
    vinylNoise?: boolean;
  };
}

const Z16 = new Array(16).fill(0);

function pattern(indices: number[], velocity = 1): StepPattern {
  const p = [...Z16];
  indices.forEach((i) => (p[i] = velocity));
  return p;
}

export const GENRES: GenrePreset[] = [
  {
    id: "metal",
    label: "Metal",
    bpm: 150,
    swing: 0,
    rootNote: "E2",
    chordProgression: [
      ["E2", "B2"],
      ["E2", "B2"],
      ["C2", "G2"],
      ["D2", "A2"],
    ],
    drums: {
      kick: pattern([0, 2, 4, 6, 7, 8, 10, 12, 14, 15], 1),
      snare: pattern([4, 12], 1),
      closedHat: pattern([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 0.7),
      openHat: pattern([], 0),
      perc: pattern([], 0),
      crashOnPhrase: true,
    },
    bassStyle: "eighthPulse",
    leadStyle: "powerChordChug",
    mix: { drive: 0.75, reverbWet: 0.12, reverbDecay: 1.2, filterCutoff: 16000 },
  },
  {
    id: "rap",
    label: "Rap / Trap",
    bpm: 140,
    swing: 0.08,
    rootNote: "C2",
    chordProgression: [
      ["C2", "Eb2", "G2"],
      ["C2", "Eb2", "G2"],
      ["Ab1", "C2", "Eb2"],
      ["Bb1", "D2", "F2"],
    ],
    drums: {
      kick: pattern([0, 6, 8, 11], 1),
      snare: pattern([4, 12], 1),
      closedHat: pattern([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 0.55),
      openHat: pattern([14], 0.6),
      perc: pattern([], 0),
      crashOnPhrase: false,
    },
    bassStyle: "808slide",
    leadStyle: "keysPad",
    mix: { drive: 0.15, reverbWet: 0.18, reverbDecay: 1.8, filterCutoff: 9000 },
  },
  {
    id: "pop",
    label: "Pop",
    bpm: 112,
    swing: 0,
    rootNote: "C3",
    chordProgression: [
      ["C3", "E3", "G3"],
      ["G2", "B2", "D3"],
      ["A2", "C3", "E3"],
      ["F2", "A2", "C3"],
    ],
    drums: {
      kick: pattern([0, 6, 8], 1),
      snare: pattern([4, 12], 0.95),
      closedHat: pattern([0, 2, 4, 6, 8, 10, 12, 14], 0.65),
      openHat: pattern([10], 0.5),
      perc: pattern([3, 11], 0.3),
      crashOnPhrase: true,
    },
    bassStyle: "syncopated",
    leadStyle: "pluck",
    mix: { drive: 0.05, reverbWet: 0.22, reverbDecay: 2.0, filterCutoff: 18000 },
  },
  {
    id: "rock",
    label: "Rock",
    bpm: 128,
    swing: 0,
    rootNote: "A2",
    chordProgression: [
      ["A2", "E3"],
      ["F2", "C3"],
      ["G2", "D3"],
      ["A2", "E3"],
    ],
    drums: {
      kick: pattern([0, 6, 8, 10], 1),
      snare: pattern([4, 12], 1),
      closedHat: pattern([0, 2, 4, 6, 8, 10, 12, 14], 0.75),
      openHat: pattern([], 0),
      perc: pattern([], 0),
      crashOnPhrase: true,
    },
    bassStyle: "eighthPulse",
    leadStyle: "powerChordChug",
    mix: { drive: 0.45, reverbWet: 0.15, reverbDecay: 1.4, filterCutoff: 15000 },
  },
  {
    id: "edm",
    label: "Electronic / EDM",
    bpm: 128,
    swing: 0,
    rootNote: "F2",
    chordProgression: [
      ["F2", "Ab2", "C3"],
      ["Db2", "F2", "Ab2"],
      ["Ab1", "C2", "Eb2"],
      ["Eb2", "G2", "Bb2"],
    ],
    drums: {
      kick: pattern([0, 4, 8, 12], 1),
      snare: pattern([4, 12], 0.9),
      closedHat: pattern([2, 6, 10, 14], 0.6),
      openHat: pattern([2, 6, 10, 14], 0.55),
      perc: pattern([0, 8], 0.25),
      crashOnPhrase: true,
    },
    bassStyle: "fourOnFloor",
    leadStyle: "supersaw",
    mix: { drive: 0.2, reverbWet: 0.2, reverbDecay: 2.2, filterCutoff: 20000 },
  },
  {
    id: "lofi",
    label: "Lo-Fi",
    bpm: 82,
    swing: 0.35,
    rootNote: "D3",
    chordProgression: [
      ["D3", "F3", "A3", "C4"],
      ["G2", "Bb2", "D3", "F3"],
      ["A2", "C3", "E3", "G3"],
      ["Bb2", "D3", "F3", "A3"],
    ],
    drums: {
      kick: pattern([0, 8], 0.85),
      snare: pattern([4, 12], 0.7),
      closedHat: pattern([0, 2, 4, 6, 8, 10, 12, 14], 0.4),
      openHat: pattern([], 0),
      perc: pattern([6, 14], 0.15),
      crashOnPhrase: false,
    },
    bassStyle: "sustainedRoot",
    leadStyle: "jazzComp",
    mix: { drive: 0.02, reverbWet: 0.3, reverbDecay: 2.5, filterCutoff: 3200, vinylNoise: true },
  },
  {
    id: "reggaeton",
    label: "Reggaeton",
    bpm: 95,
    swing: 0,
    rootNote: "G2",
    chordProgression: [
      ["G2", "Bb2", "D3"],
      ["Eb2", "G2", "Bb2"],
      ["C2", "Eb2", "G2"],
      ["D2", "F2", "A2"],
    ],
    drums: {
      kick: pattern([0, 3, 6, 8, 11, 14], 1),
      snare: pattern([3, 6, 11, 14], 0.9),
      closedHat: pattern([0, 2, 4, 6, 8, 10, 12, 14], 0.6),
      openHat: pattern([2, 10], 0.5),
      perc: pattern([1, 5, 9, 13], 0.3),
      crashOnPhrase: false,
    },
    bassStyle: "syncopated",
    leadStyle: "pluck",
    mix: { drive: 0.1, reverbWet: 0.16, reverbDecay: 1.6, filterCutoff: 14000 },
  },
  {
    id: "jazz",
    label: "Jazz",
    bpm: 120,
    swing: 0.55,
    rootNote: "Bb2",
    chordProgression: [
      ["Bb2", "D3", "F3", "Ab3"],
      ["Eb2", "G2", "Bb2", "D3"],
      ["A2", "C3", "Eb3", "G3"],
      ["D2", "F2", "A2", "C3"],
    ],
    drums: {
      kick: pattern([0, 10], 0.6),
      snare: pattern([4, 12], 0.25),
      closedHat: pattern([0, 3, 4, 7, 8, 11, 12, 15], 0.55),
      openHat: pattern([], 0),
      perc: pattern([6, 14], 0.2),
      crashOnPhrase: false,
    },
    bassStyle: "walking",
    leadStyle: "jazzComp",
    mix: { drive: 0, reverbWet: 0.25, reverbDecay: 2.0, filterCutoff: 12000 },
  },
];

export function getGenre(id: string): GenrePreset {
  const g = GENRES.find((g) => g.id === id);
  if (!g) throw new Error(`Unknown genre: ${id}`);
  return g;
}
