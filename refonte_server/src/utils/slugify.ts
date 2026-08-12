// Plage Unicode des diacritiques combinants (accents) une fois le texte
// normalisé en NFD (ex. "e" + accent combinant séparé au lieu de "é" composé).
// Construite via charCode plutôt qu'un littéral dans une classe de
// caractères regex, pour éviter tout souci d'encodage de fichier.
const COMBINING_RANGE_START = String.fromCharCode(0x0300);
const COMBINING_RANGE_END = String.fromCharCode(0x036f);
const COMBINING_DIACRITICAL_MARKS = new RegExp(`[${COMBINING_RANGE_START}-${COMBINING_RANGE_END}]`, 'g');

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(COMBINING_DIACRITICAL_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
