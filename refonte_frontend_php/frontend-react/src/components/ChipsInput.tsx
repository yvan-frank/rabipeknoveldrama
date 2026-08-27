import { useState, type KeyboardEvent } from 'react';

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

// Port fidèle de refonte_rabi_frontend/src/components/ui/ChipsInput.tsx :
// Entrée ou virgule valide un tag, Retour arrière sur champ vide retire le
// dernier — remplace un texte libre pour un champ conceptuellement une
// liste (sujets abordés).
export function ChipsInput({ value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('');

  function commitDraft() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft('');
      return;
    }
    if (!value.includes(trimmed)) onChange([...value, trimmed]);
    setDraft('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitDraft();
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-neutral-900">
      {value.map((chip) => (
        <span
          key={chip}
          className="inline-flex items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 text-xs font-semibold text-brand-amber"
        >
          {chip}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== chip))}
            aria-label={`Retirer ${chip}`}
            className="border-none bg-transparent p-0 text-sm leading-none text-inherit opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-32 flex-1 border-none bg-transparent p-1 text-sm text-neutral-900 outline-none dark:text-neutral-100"
      />
    </div>
  );
}
