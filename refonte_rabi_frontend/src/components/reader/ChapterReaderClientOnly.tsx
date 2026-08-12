'use client';

import dynamic from 'next/dynamic';

// La pagination (DOMPurify + parsing DOM) n'a de sens que côté navigateur —
// `ssr: false` évite tout rendu serveur de ce composant, ce qui permet à
// ChapterReader de dériver ses pages via un simple useMemo (pas d'effet,
// pas de mismatch d'hydratation possible puisqu'il n'y a rien à comparer).
// `ssr: false` n'est autorisé que depuis un Client Component, d'où ce wrapper
// séparé — la page qui l'utilise est un Server Component.
export const ChapterReaderClientOnly = dynamic(
  () => import('./ChapterReader').then((mod) => mod.ChapterReader),
  { ssr: false },
);
