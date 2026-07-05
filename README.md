# Sunna Beat Maker

Sunna is a browser-based beat maker. Pick a genre, set a length in minutes and
seconds, and it generates a full instrumental beat — drums, bass, and
lead/chords — that you can preview and download as a WAV file for free.

Everything runs client-side: there's no backend, no account, and no cost.
The audio is rendered on the fly by a procedural synthesis engine built on
[Tone.js](https://tonejs.github.io/), not by streaming pre-made samples or
calling a paid AI model.

## Features

- **Genre picker** — tick one of eight genres, each with its own tempo, drum
  pattern, bassline style, chord progression, and lead/synth character:
  Metal, Rap/Trap, Pop, Rock, Electronic/EDM, Lo-Fi, Reggaeton, Jazz.
- **Custom length** — set the beat's duration precisely in minutes and
  seconds.
- **Full mix, not just a loop** — every beat runs through a mastering chain
  (EQ, compression, limiting, reverb) with a clean fade in/out, so it sounds
  like a finished mix rather than a raw drum loop.
- **Free download** — export the rendered beat as a standard 16-bit WAV file,
  no watermark, no paywall, no sign-up.
- **Waveform preview** — see and hear the beat before downloading it.

## How it works

1. Choosing a genre selects a preset ([`src/lib/genrePresets.ts`](src/lib/genrePresets.ts))
   describing its BPM, swing, chord progression, and drum/bass/lead patterns.
2. Generating a beat renders that preset offline through a Tone.js signal
   chain ([`src/lib/beatEngine.ts`](src/lib/beatEngine.ts)) — synthesized
   drums, bass, and lead voices feeding a shared mastering bus — for exactly
   the requested duration.
3. The rendered audio buffer is encoded into a WAV file in-browser
   ([`src/lib/wav.ts`](src/lib/wav.ts)) and handed to you as a downloadable
   blob.

Because generation is procedural rather than a trained AI model, it's
instant and free, but it won't sound indistinguishable from a human
producer's beat. It's meant to be a genuinely usable starting point or
practice loop, not a replacement for a mixed/mastered studio track.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`) in your
browser.

To build a production bundle:

```bash
npm run build
npm run preview
```

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for dev server and bundling
- [Tone.js](https://tonejs.github.io/) for audio synthesis and offline
  rendering

## Project structure

```
src/
  lib/
    genrePresets.ts   # genre definitions: tempo, chords, drum/bass/lead patterns
    beatEngine.ts      # Tone.js synthesis + mastering chain, renders a beat offline
    wav.ts             # encodes the rendered audio buffer as a WAV blob
  components/
    GenreSelector.tsx  # genre tick-list
    DurationInput.tsx  # minutes/seconds picker
    Waveform.tsx        # canvas waveform preview
  App.tsx              # ties everything together
```
