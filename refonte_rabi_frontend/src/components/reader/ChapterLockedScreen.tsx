'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';

interface ChapterLockedScreenProps {
  bookSlug: string;
  // 'auth' : visiteur anonyme sur un chapitre verrouillé -> modale de
  // connexion/inscription ouverte automatiquement.
  // 'purchase' : déjà connecté, mais le livre n'est pas acheté (pas de
  // parcours d'achat en ligne pour l'instant, cf. module achats).
  reason: 'auth' | 'purchase';
}

export function ChapterLockedScreen({ bookSlug, reason }: ChapterLockedScreenProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(reason === 'auth');

  function handleAuthenticated() {
    setIsModalOpen(false);
    // Recharge les données serveur de la page (le cookie de session est
    // maintenant valide) : l'utilisateur "revient là où il était", authentifié.
    router.refresh();
  }

  return (
    <div className="relative flex h-dvh flex-col items-center justify-center gap-4 bg-neutral-300 px-6 text-center dark:bg-[#100e0c]">
      <div className="flex size-16 items-center justify-center rounded-full bg-black/10 dark:bg-white/10">
        <Lock size={28} />
      </div>

      <h1 className="text-xl font-semibold">{reason === 'auth' ? 'Connexion requise' : 'Achat requis'}</h1>

      <p className="max-w-xs text-sm text-black/60 dark:text-white/60">
        {reason === 'auth'
          ? 'Connectez-vous ou créez un compte pour continuer la lecture de ce chapitre.'
          : "Ce chapitre fait partie du contenu payant de ce livre. L'achat en ligne n'est pas encore disponible."}
      </p>

      <div className="mt-2 flex gap-3">
        {reason === 'auth' && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-6 py-2.5 text-sm font-semibold text-black"
          >
            Se connecter
          </button>
        )}
        <Link
          href={`/livres/${bookSlug}`}
          className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-medium dark:border-white/20"
        >
          Retour au livre
        </Link>
      </div>

      {reason === 'auth' && (
        <AuthModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAuthenticated={handleAuthenticated}
          title="Continuez votre lecture"
          description="Connectez-vous ou créez un compte pour accéder à ce chapitre."
        />
      )}
    </div>
  );
}
