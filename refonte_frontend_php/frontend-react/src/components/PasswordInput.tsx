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
    <div className="password-input">
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
      />
      <button
        type="button"
        onClick={() => setIsVisible((v) => !v)}
        aria-label={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {isVisible ? '🙈' : '👁'}
      </button>
    </div>
  );
}
