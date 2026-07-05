import { useState } from "react";
import * as Tone from "tone";
import { GENRES, getGenre } from "./lib/genrePresets";
import { renderBeat, MIN_DURATION } from "./lib/beatEngine";
import { audioBufferToWav } from "./lib/wav";
import { GenreSelector } from "./components/GenreSelector";
import { DurationInput } from "./components/DurationInput";
import { Waveform } from "./components/Waveform";
import "./App.css";

interface Result {
  audioUrl: string;
  audioBuffer: AudioBuffer;
  fileName: string;
}

export default function App() {
  const [genreId, setGenreId] = useState(GENRES[0].id);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const totalSeconds = minutes * 60 + seconds;

  async function handleGenerate() {
    setError(null);

    if (totalSeconds < MIN_DURATION) {
      setError(`Beat length must be at least ${MIN_DURATION} seconds.`);
      return;
    }

    setIsGenerating(true);
    setResult(null);
    try {
      await Tone.start();
      const genre = getGenre(genreId);
      const buffer = await renderBeat(genre, totalSeconds);
      const blob = audioBufferToWav(buffer);
      const url = URL.createObjectURL(blob);
      const fileName = `sunna-${genre.id}-${minutes}m${seconds}s.wav`;
      setResult({ audioUrl: url, audioBuffer: buffer, fileName });
    } catch (err) {
      console.error(err);
      setError("Something went wrong while generating the beat. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Sunna Beat Maker</h1>
        <p>Pick a genre, set a length, and generate a free, downloadable beat.</p>
      </header>

      <section className="card">
        <h2>1. Choose a genre</h2>
        <GenreSelector selectedId={genreId} onChange={setGenreId} disabled={isGenerating} />
      </section>

      <section className="card">
        <h2>2. Set the beat length</h2>
        <DurationInput
          minutes={minutes}
          seconds={seconds}
          onChange={(m, s) => {
            setMinutes(m);
            setSeconds(s);
          }}
          disabled={isGenerating}
        />
      </section>

      <section className="card actions">
        <button className="generate-btn" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "Generating…" : "Generate Beat"}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="card result">
          <h2>Your beat is ready</h2>
          <Waveform buffer={result.audioBuffer} />
          <audio controls src={result.audioUrl} className="player" />
          <a className="download-btn" href={result.audioUrl} download={result.fileName}>
            Download WAV — free
          </a>
        </section>
      )}

      <footer className="footer">
        <p>All beats are generated in your browser and are 100% free to download and use.</p>
      </footer>
    </div>
  );
}
