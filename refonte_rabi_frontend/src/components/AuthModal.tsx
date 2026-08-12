'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from '@/components/forms/LoginForm';
import { RegisterForm } from '@/components/forms/RegisterForm';
import type { AuthUser } from '@/types/api';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
  title?: string;
  description?: string;
}

// Modale de connexion/inscription réutilisable — réutilise LoginForm/
// RegisterForm (mêmes formulaires que /connexion et /inscription) via leur
// callback `onSuccess`, pour ne pas dupliquer la logique d'auth.
export function AuthModal({ open, onClose, onAuthenticated, title, description }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Connexion'}
        className={`fixed inset-x-4 top-1/2 z-[70] mx-auto max-w-sm -translate-y-1/2 overflow-hidden rounded-3xl border border-black/10 bg-background shadow-2xl transition-all duration-300 dark:border-white/10 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="relative bg-gradient-to-br from-brand-amber/20 via-transparent to-brand-pink/20 px-6 pt-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
          >
            <X size={16} />
          </button>
          <p className="text-lg font-semibold">{title ?? 'Continuez votre lecture'}</p>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {description ?? 'Connectez-vous ou créez un compte pour accéder à ce chapitre.'}
          </p>
        </div>

        <div className="flex border-b border-black/10 px-6 dark:border-white/10">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 border-b-2 py-3 text-sm font-medium transition ${
              tab === 'login'
                ? 'border-brand-amber text-brand-amber'
                : 'border-transparent text-black/50 dark:text-white/50'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 border-b-2 py-3 text-sm font-medium transition ${
              tab === 'register'
                ? 'border-brand-amber text-brand-amber'
                : 'border-transparent text-black/50 dark:text-white/50'
            }`}
          >
            Inscription
          </button>
        </div>

        <div className="px-6 py-6">
          {tab === 'login' ? (
            <LoginForm onSuccess={onAuthenticated} />
          ) : (
            <RegisterForm onSuccess={onAuthenticated} enableAuthorOnboarding={false} />
          )}
        </div>
      </div>
    </>
  );
}
