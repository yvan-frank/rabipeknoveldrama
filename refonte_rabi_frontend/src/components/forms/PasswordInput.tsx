'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface PasswordInputProps {
  id: string;
  autoComplete?: string;
  registration: UseFormRegisterReturn;
  onFocus?: () => void;
  onBlurCapture?: () => void;
}

// Champ mot de passe avec bouton œil pour afficher/masquer — partagé entre
// LoginForm et RegisterForm (et tout futur formulaire avec mot de passe).
export function PasswordInput({ id, autoComplete, registration, onFocus, onBlurCapture }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        autoComplete={autoComplete}
        onFocus={onFocus}
        onBlurCapture={onBlurCapture}
        className="w-full rounded-md border border-black/15 px-3 py-2 pr-10 dark:border-white/20"
        {...registration}
      />
      <button
        type="button"
        onClick={() => setIsVisible((v) => !v)}
        aria-label={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-black/40 transition hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
      >
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
