const STORAGE_KEY = 'rabipek-continue-reading';

export interface ContinueReadingEntry {
  bookSlug: string;
  bookTitle: string;
  bookCover: string;
  chapterNumber: number;
  totalChapters: number;
  updatedAt: number;
}

export function saveContinueReading(entry: Omit<ContinueReadingEntry, 'updatedAt'>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...entry, updatedAt: Date.now() }));
  } catch {
    // stockage indisponible (navigation privée, quota) : on continue sans persistance
  }
}

// Snapshot mis en cache tant que la chaîne brute ne change pas — nécessaire
// pour useSyncExternalStore (cf. useContinueReading) : renvoyer un nouvel
// objet à chaque appel (re-JSON.parse) casserait sa comparaison de
// référence et provoquerait une boucle de re-rendus.
let cachedRaw: string | null = null;
let cachedEntry: ContinueReadingEntry | null = null;

export function getContinueReadingSnapshot(): ContinueReadingEntry | null {
  if (typeof window === 'undefined') return null;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedEntry = raw ? (JSON.parse(raw) as ContinueReadingEntry) : null;
    } catch {
      cachedEntry = null;
    }
  }

  return cachedEntry;
}
