'use client';

import { useSyncExternalStore } from 'react';
import { getContinueReadingSnapshot } from '@/lib/continue-reading';

// Pas de source d'évènement à écouter (localStorage ne notifie pas les
// écritures faites depuis le même onglet) — chaque montage relit l'état
// actuel via getSnapshot, ce qui suffit puisque ce composant démonte/remonte
// à chaque passage par une page de lecture (cf. SiteChrome, branche immersive).
function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return null;
}

export function useContinueReading() {
  return useSyncExternalStore(subscribe, getContinueReadingSnapshot, getServerSnapshot);
}
