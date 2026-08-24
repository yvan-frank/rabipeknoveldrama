import type { BookDetail, BookPartSummary, ChapterSummary } from '../api/books';

export interface ChapterEntry {
  chapter: ChapterSummary;
  part: BookPartSummary | null;
  locked: boolean;
}

// Miroir simplifié d'assertChapterAccess côté serveur (chapters.service.ts) —
// purement informatif pour l'UI (icône verrou, désactivation du bouton
// suivant/précédent) : le serveur reste la seule autorité, il revérifie tout
// à l'ouverture réelle du chapitre.
export function isChapterLocked(chapter: ChapterSummary, book: BookDetail, part: BookPartSummary | null): boolean {
  if (part) {
    if (part.isFree || part.isPurchased) return false;
    const index = part.chapters.findIndex((candidate) => candidate.id === chapter.id);
    return index + 1 > part.freeChapterCount;
  }
  if (book.isFree) return false;
  return chapter.chapterNumber > book.freeChapterCount;
}

// Liste à plat, dans l'ordre de lecture, de tous les chapitres du livre
// (parties puis chapitres hors partie), utile pour la navigation
// précédent/suivant et le calcul de verrouillage du lecteur.
export function flattenChapters(book: BookDetail): ChapterEntry[] {
  const partEntries = book.parts.flatMap((part) =>
    part.chapters.map((chapter) => ({ chapter, part, locked: isChapterLocked(chapter, book, part) })),
  );
  const topLevelEntries = book.chapters.map((chapter) => ({ chapter, part: null, locked: isChapterLocked(chapter, book, null) }));
  return [...partEntries, ...topLevelEntries].sort((a, b) => a.chapter.chapterNumber - b.chapter.chapterNumber);
}
