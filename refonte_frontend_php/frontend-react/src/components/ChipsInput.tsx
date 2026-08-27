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
    <div className="chips-input">
      {value.map((chip) => (
        <span key={chip} className="chips-input__chip">
          {chip}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== chip))} aria-label={`Retirer ${chip}`}>
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
      />
    </div>
  );
}
