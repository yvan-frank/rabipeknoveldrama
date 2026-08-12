'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface ChipsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

// Saisie de tags (Entrée ou virgule pour valider, Retour arrière sur champ
// vide pour retirer le dernier) — remplace un simple textarea pour un champ
// qui est conceptuellement une liste (ex. sujets abordés), pas un texte libre.
export function ChipsInput({ value, onChange, placeholder }: ChipsInputProps) {
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
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-black/15 bg-transparent px-2 py-1.5 focus-within:border-brand-amber/50 dark:border-white/20">
      {value.map((chip) => (
        <span
          key={chip}
          className="flex items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
        >
          {chip}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== chip))}
            aria-label={`Retirer ${chip}`}
            className="text-amber-700/60 hover:text-amber-700 dark:text-amber-300/60 dark:hover:text-amber-300"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm outline-none"
      />
    </div>
  );
}
