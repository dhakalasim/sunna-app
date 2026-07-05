import { MAX_DURATION } from "../lib/beatEngine";

interface Props {
  minutes: number;
  seconds: number;
  onChange: (minutes: number, seconds: number) => void;
  disabled?: boolean;
}

export function DurationInput({ minutes, seconds, onChange, disabled }: Props) {
  const maxMinutes = Math.floor(MAX_DURATION / 60);

  return (
    <div className="duration-row">
      <label className="duration-field">
        <span>Minutes</span>
        <input
          type="number"
          min={0}
          max={maxMinutes}
          value={minutes}
          disabled={disabled}
          onChange={(e) => {
            const m = Math.max(0, Math.min(maxMinutes, Number(e.target.value) || 0));
            onChange(m, seconds);
          }}
        />
      </label>
      <span className="duration-colon">:</span>
      <label className="duration-field">
        <span>Seconds</span>
        <input
          type="number"
          min={0}
          max={59}
          value={seconds}
          disabled={disabled}
          onChange={(e) => {
            const s = Math.max(0, Math.min(59, Number(e.target.value) || 0));
            onChange(minutes, s);
          }}
        />
      </label>
    </div>
  );
}
