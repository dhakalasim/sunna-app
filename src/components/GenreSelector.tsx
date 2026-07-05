import { GENRES } from "../lib/genrePresets";

interface Props {
  selectedId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function GenreSelector({ selectedId, onChange, disabled }: Props) {
  return (
    <div className="genre-grid" role="group" aria-label="Genre selection">
      {GENRES.map((g) => {
        const checked = g.id === selectedId;
        return (
          <label key={g.id} className={`genre-option ${checked ? "checked" : ""}`}>
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(g.id)}
            />
            <span className="genre-check" aria-hidden="true" />
            <span className="genre-label">{g.label}</span>
          </label>
        );
      })}
    </div>
  );
}
