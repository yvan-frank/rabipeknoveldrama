'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

const AGE_COOKIE_NAME = 'rabipek_age_confirmed';
// Un an — cohérent avec la durée du cookie de session (cf. auth.controller.ts).
const AGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

interface AgeGateProps {
  bookTitle: string;
}

// Le choix persiste via un cookie (pas localStorage) : c'est justement ce qui
// permet à la page détail (Server Component) de décider AVANT le rendu si le
// contenu doit être révélé ou remplacé par cet écran — cf. livres/[slug]/page.tsx.
// Une fois confirmé, router.refresh() relance le Server Component qui verra
// le cookie et affichera le vrai contenu.
export function AgeGate({ bookTitle }: AgeGateProps) {
  const router = useRouter();
  const [hasDeclined, setHasDeclined] = useState(false);

  function confirmAge() {
    document.cookie = `${AGE_COOKIE_NAME}=true; path=/; max-age=${AGE_COOKIE_MAX_AGE}; SameSite=Lax`;
    router.refresh();
  }

  if (hasDeclined) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <ShieldAlert size={32} className="text-black/30 dark:text-white/30" />
        <p className="text-sm text-black/60 dark:text-white/60">
          Ce livre n&apos;est pas accessible aux moins de 18 ans.
        </p>
        <Link href="/livres" className="text-sm font-medium text-brand-amber hover:underline">
          ← Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-24 text-center">
      <span className="flex items-center gap-2 rounded-full bg-rose-400/15 px-4 py-1.5 text-xs font-semibold tracking-wide text-rose-600 uppercase dark:text-rose-300">
        <ShieldAlert size={14} />
        Contenu réservé aux 18 ans et plus
      </span>
      <h1 className="text-xl font-bold">{bookTitle}</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Ce livre est classé pour un public averti. Confirmez votre âge pour continuer.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={confirmAge}
          className="rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
        >
          J&apos;ai 18 ans ou plus
        </button>
        <button
          type="button"
          onClick={() => setHasDeclined(true)}
          className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-medium dark:border-white/20"
        >
          J&apos;ai moins de 18 ans
        </button>
      </div>
    </div>
  );
}
