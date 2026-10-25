import { useEffect, useState, type FormEvent } from 'react';

interface ToolbarProps {
  seed: string;
  onGenerate: (seed: string) => void;
  status: string;
}

export function Toolbar({ seed, onGenerate, status }: ToolbarProps) {
  const [draft, setDraft] = useState(seed);
  useEffect(() => setDraft(seed), [seed]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (next) onGenerate(next);
  };

  const random = () => onGenerate(randomSeed());

  return (
    <form className="toolbar" onSubmit={submit}>
      <span className="brand">Atlas</span>
      <label className="field">
        <span>Seed</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          aria-label="Seed"
        />
      </label>
      <button type="submit">Regenerate</button>
      <button type="button" onClick={random}>
        Random
      </button>
      <span className="status">{status}</span>
    </form>
  );
}

function randomSeed(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return bytes[0]!.toString(36).slice(0, 6);
}
