import { useState } from 'react';

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  required?: boolean;
}

// Champ mot de passe avec bouton œil pour afficher/masquer — port de
// refonte_rabi_frontend/src/components/forms/PasswordInput.tsx, partagé
// entre LoginForm et RegisterForm.
export function PasswordInput({ id, value, onChange, autoComplete, onFocus, onBlur, required }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 pr-10 text-sm text-neutral-900 focus:border-brand-amber focus:ring-3 focus:ring-brand-amber/20 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
      />
      <button
        type="button"
        onClick={() => setIsVisible((v) => !v)}
        aria-label={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute inset-y-0 right-2.5 flex items-center text-base opacity-60 hover:opacity-100"
      >
        {isVisible ? '🙈' : '👁'}
      </button>
    </div>
  );
}
