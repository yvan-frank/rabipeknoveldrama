import DOMPurify from 'dompurify';

const DEFAULT_WORDS_PER_PAGE = 220;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// Axe A (cf. étude de faisabilité) : découpage déterministe par nombre de
// mots, aux frontières de blocs (paragraphe/titre/liste) uniquement — jamais
// en plein milieu d'un paragraphe. Un bloc à lui seul plus long que la cible
// occupe sa propre page (rare, et le conteneur scrolle dans ce cas précis).
// Déterministe : la "page 12" d'un chapitre est la même pour tout le monde,
// contrairement à une pagination par reflow visuel qui dépendrait de l'écran.
export function paginateChapterHtml(
  html: string,
  wordsPerPage: number = DEFAULT_WORDS_PER_PAGE,
): string[] {
  const sanitized = DOMPurify.sanitize(html);
  const container = document.createElement('div');
  container.innerHTML = sanitized;

  const blocks = Array.from(container.children).filter((el) => (el.textContent ?? '').trim());

  // Contenu sans balises de bloc (texte brut legacy) : une seule page.
  if (blocks.length === 0) {
    return sanitized.trim() ? [sanitized] : [];
  }

  const pages: string[] = [];
  let currentBlocks: string[] = [];
  let currentWordCount = 0;

  for (const block of blocks) {
    const blockWordCount = countWords(block.textContent ?? '');

    if (currentBlocks.length > 0 && currentWordCount + blockWordCount > wordsPerPage) {
      pages.push(currentBlocks.join(''));
      currentBlocks = [];
      currentWordCount = 0;
    }

    currentBlocks.push(block.outerHTML);
    currentWordCount += blockWordCount;
  }

  if (currentBlocks.length > 0) {
    pages.push(currentBlocks.join(''));
  }

  return pages;
}
