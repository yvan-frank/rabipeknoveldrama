'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { Pause, Play, Square } from 'lucide-react';

const HIGHLIGHT_CLASSES = ['bg-amber-300', 'dark:bg-amber-500/70', 'rounded-sm'];
const PAGE_TARGET_CHARACTERS = 1_600;
const RATE_MIN = 0.5;
const RATE_MAX = 2;
const RATE_STEP = 0.1;

interface WordSpan {
  el: HTMLElement;
  start: number;
  end: number;
}

interface Block {
  element: HTMLElement;
  text: string;
  words: WordSpan[];
}

interface SpeechSegment {
  blockIndex: number;
  start: number;
  text: string;
  isDialogue: boolean;
}

interface ReaderPage {
  firstBlockIndex: number;
  lastBlockIndex: number;
}

// Detect typographically explicit dialogue without attempting to guess the
// character speaking. This keeps the selected dialogue voice deterministic.
function splitSpeechSegments(text: string): Array<Omit<SpeechSegment, 'blockIndex'>> {
  const matches = [
    ...text.matchAll(/«[^»]+»|“[^”]+”|\"[^\"]+\"|(?:^|\n)\s*[-—–]\s*[^\n]+/g),
  ];

  if (matches.length === 0) return [{ start: 0, text, isDialogue: false }];

  const segments: Array<Omit<SpeechSegment, 'blockIndex'>> = [];
  let cursor = 0;

  for (const match of matches) {
    const start = match.index ?? 0;
    const dialogue = match[0];
    if (start > cursor) {
      segments.push({ start: cursor, text: text.slice(cursor, start), isDialogue: false });
    }
    segments.push({ start, text: dialogue, isDialogue: true });
    cursor = start + dialogue.length;
  }

  if (cursor < text.length) {
    segments.push({ start: cursor, text: text.slice(cursor), isDialogue: false });
  }

  return segments.filter((segment) => segment.text.trim().length > 0);
}

function createPages(blocks: Block[]): ReaderPage[] {
  if (blocks.length === 0) return [];

  const pages: ReaderPage[] = [];
  let firstBlockIndex = 0;
  let characters = 0;

  blocks.forEach((block, blockIndex) => {
    const wouldOverflow = characters > 0 && characters + block.text.length > PAGE_TARGET_CHARACTERS;
    if (wouldOverflow) {
      pages.push({ firstBlockIndex, lastBlockIndex: blockIndex - 1 });
      firstBlockIndex = blockIndex;
      characters = 0;
    }
    characters += block.text.length;
  });

  pages.push({ firstBlockIndex, lastBlockIndex: blocks.length - 1 });
  return pages;
}

// Lecture à voix haute via l'API Web Speech du navigateur (Option A retenue :
// pas de pipeline audio/TTS côté serveur, tout se passe ici). Le HTML du
// chapitre (sorti de Tiptap côté auteur) est d'abord assaini, puis chaque mot
// est enveloppé dans un <span> individuel pour pouvoir lui appliquer la
// surbrillance. Chaque bloc de premier niveau (paragraphe, titre...) devient
// une utterance séparée : `SpeechSynthesisUtterance` gère mal les très longs
// textes en un seul bloc, et on a besoin d'un charIndex par bloc pour
// retrouver le bon mot via `onboundary`.
export function ImmersiveReader({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<Block[]>([]);
  const segmentsRef = useRef<SpeechSegment[]>([]);
  const pagesRef = useRef<ReaderPage[]>([]);
  const pageIndexByBlockRef = useRef<number[]>([]);
  const activeWordRef = useRef<HTMLElement | null>(null);
  const currentSegmentIndexRef = useRef(0);
  const speechRunRef = useRef(0);
  // Trampoline : évite que `speakFrom` se référence elle-même dans son propre
  // corps (onend rappelle la version la plus à jour via cette ref, jamais la
  // fonction directement — sinon ESLint/react-hooks refuse la self-référence).
  const speakFromRef = useRef<(segmentIndex: number) => void>(() => {});

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [narratorVoiceURI, setNarratorVoiceURI] = useState('');
  const [dialogueVoiceURI, setDialogueVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Charge la liste des voix disponibles. Certains navigateurs (Chrome
  // notamment) la peuplent de façon asynchrone après le premier appel.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Le contenu du site est en français : on ne propose que les voix
  // francophones (une voix anglaise lisant du français est inutilisable).
  const frenchVoices = useMemo(
    () => voices.filter((v) => v.lang.toLowerCase().startsWith('fr')),
    [voices],
  );

  // Tant que l'utilisateur n'a rien choisi explicitement, la voix "effective"
  // est dérivée directement au rendu (première voix française disponible)
  // plutôt que synchronisée en state via un effect.
  const autoNarratorVoiceURI = useMemo(
    () => narratorVoiceURI || frenchVoices[0]?.voiceURI || '',
    [narratorVoiceURI, frenchVoices],
  );

  const autoDialogueVoiceURI = useMemo(
    () =>
      dialogueVoiceURI ||
      frenchVoices.find((voice) => voice.voiceURI !== autoNarratorVoiceURI)?.voiceURI ||
      autoNarratorVoiceURI,
    [dialogueVoiceURI, frenchVoices, autoNarratorVoiceURI],
  );

  // Enveloppe chaque mot d'un élément dans un <span>, et retourne le bloc
  // correspondant (texte brut + spans avec leurs offsets de caractères).
  function wrapWordsIn(element: HTMLElement): Block | null {
    const text = element.textContent ?? '';
    if (!text.trim()) return null;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) textNodes.push(node as Text);

    let offset = 0;
    const words: WordSpan[] = [];

    textNodes.forEach((textNode) => {
      const value = textNode.textContent ?? '';
      const fragment = document.createDocumentFragment();
      const tokens = value.match(/\S+|\s+/g) ?? [];

      for (const token of tokens) {
        if (/\S/.test(token)) {
          const span = document.createElement('span');
          span.textContent = token;
          words.push({ el: span, start: offset, end: offset + token.length });
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(token));
        }
        offset += token.length;
      }

      textNode.replaceWith(fragment);
    });

    return { element, text, words };
  }

  // Sépare le HTML en blocs (un par enfant de premier niveau — paragraphe,
  // titre...) et enveloppe chaque mot dans un span. Si le contenu ne contient
  // aucun élément de bloc (texte brut sans balises, ex. contenu legacy pas
  // encore passé par Tiptap), le conteneur entier est traité comme un bloc
  // unique plutôt que de ne rien lire du tout.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = DOMPurify.sanitize(html);

    const blocks: Block[] = [];

    if (container.children.length === 0) {
      const block = wrapWordsIn(container);
      if (block) blocks.push(block);
    } else {
      Array.from(container.children).forEach((child) => {
        const block = wrapWordsIn(child as HTMLElement);
        if (block) blocks.push(block);
      });
    }

    blocksRef.current = blocks;
    segmentsRef.current = blocks.flatMap((block, blockIndex) =>
      splitSpeechSegments(block.text).map((segment) => ({ ...segment, blockIndex })),
    );
    const pages = createPages(blocks);
    pagesRef.current = pages;
    pageIndexByBlockRef.current = blocks.map((_, blockIndex) =>
      pages.findIndex(
        (page) => blockIndex >= page.firstBlockIndex && blockIndex <= page.lastBlockIndex,
      ),
    );
    blocks.forEach((block, blockIndex) => {
      block.element.hidden = pageIndexByBlockRef.current[blockIndex] !== 0;
    });
    setCurrentPage(0);
    setTotalPages(pages.length);

    return () => {
      speechRunRef.current += 1;
      window.speechSynthesis?.cancel();
    };
  }, [html]);

  useEffect(() => {
    blocksRef.current.forEach((block, blockIndex) => {
      block.element.hidden = pageIndexByBlockRef.current[blockIndex] !== currentPage;
    });
  }, [currentPage]);

  const clearHighlight = useCallback(() => {
    activeWordRef.current?.classList.remove(...HIGHLIGHT_CLASSES);
    activeWordRef.current = null;
  }, []);

  const highlightWordAt = useCallback(
    (blockIndex: number, charIndex: number) => {
      const block = blocksRef.current[blockIndex];
      const word = block?.words.find((w) => charIndex >= w.start && charIndex < w.end);
      if (!word || word.el === activeWordRef.current) return;

      clearHighlight();
      word.el.classList.add(...HIGHLIGHT_CLASSES);
      activeWordRef.current = word.el;
      word.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [clearHighlight],
  );

  const speakFrom = useCallback(
    (segmentIndex: number) => {
      const segments = segmentsRef.current;
      currentSegmentIndexRef.current = segmentIndex;

      if (segmentIndex >= segments.length) {
        setIsPlaying(false);
        setIsPaused(false);
        clearHighlight();
        return;
      }

      const segment = segments[segmentIndex];
      const pageIndex = pageIndexByBlockRef.current[segment.blockIndex];
      if (pageIndex !== undefined) setCurrentPage(pageIndex);
      const run = speechRunRef.current;
      const utterance = new SpeechSynthesisUtterance(segment.text);
      utterance.lang = 'fr-FR';
      utterance.rate = rate;
      const voiceURI = segment.isDialogue ? autoDialogueVoiceURI : autoNarratorVoiceURI;
      const voice = voices.find((v) => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;

      // Certains navigateurs (Safari notamment) ne renseignent pas `event.name`
      // ou ne déclenchent pas `onboundary` de façon fiable : on tente quand
      // même de surligner à chaque événement disponible, sans bloquer la
      // lecture si rien ne se déclenche.
      utterance.onboundary = (event) => {
        highlightWordAt(segment.blockIndex, segment.start + event.charIndex);
      };

      utterance.onend = () => {
        if (run === speechRunRef.current) speakFromRef.current(segmentIndex + 1);
      };
      utterance.onerror = () => {
        if (run !== speechRunRef.current) return;
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [rate, autoNarratorVoiceURI, autoDialogueVoiceURI, voices, highlightWordAt, clearHighlight],
  );

  useEffect(() => {
    speakFromRef.current = speakFrom;
  }, [speakFrom]);

  // Un changement de voix ou de vitesse en cours de lecture redémarre
  // l'utterance en cours (depuis le début de son bloc — on perd la position
  // exacte dans la phrase, compromis acceptable pour un réglage à la volée).
  //
  // Le `setTimeout` est nécessaire : enchaîner `cancel()` puis `speak()` dans
  // le même tick laisse le moteur de synthèse de Chrome dans un état instable
  // où `onboundary` ne se déclenche plus du tout pour les utterances
  // suivantes (le surlignage cesse silencieusement, sans erreur). Un court
  // délai après `cancel()` avant de relancer évite ce bug.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) return;

    speechRunRef.current += 1;
    window.speechSynthesis.cancel();
    const timeoutId = window.setTimeout(() => {
      speakFrom(currentSegmentIndexRef.current);
    }, 150);

    return () => window.clearTimeout(timeoutId);
    // speakFrom change de référence précisément quand `rate`/`autoVoiceURI`
    // changent (ce sont ses propres dépendances) : l'inclure ici suffit à ne
    // redémarrer que sur un changement de réglage, jamais sur un rendu quelconque.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, autoNarratorVoiceURI, autoDialogueVoiceURI]);

  function handlePlay() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsUnsupported(true);
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    speechRunRef.current += 1;
    window.speechSynthesis.cancel();
    setIsPlaying(true);
    setIsPaused(false);
    speakFrom(0);
  }

  function handlePause() {
    window.speechSynthesis.pause();
    setIsPaused(true);
  }

  function handleStop() {
    speechRunRef.current += 1;
    window.speechSynthesis.cancel();
    clearHighlight();
    setIsPlaying(false);
    setIsPaused(false);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === currentPage) return;
    speechRunRef.current += 1;
    window.speechSynthesis.cancel();
    clearHighlight();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPage(nextPage);
  }

  return (
    <div className="flex flex-col gap-6">
      {isUnsupported ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          La lecture audio n&apos;est pas supportée par ce navigateur. Le texte reste lisible
          ci-dessous.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            {!isPlaying || isPaused ? (
              <button
                type="button"
                onClick={handlePlay}
                className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background"
              >
                <Play size={16} />
                {isPaused ? 'Reprendre' : 'Écouter'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-2 rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/20"
              >
                <Pause size={16} />
                Pause
              </button>
            )}

            {isPlaying && (
              <button
                type="button"
                onClick={handleStop}
                className="flex items-center gap-2 rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/20"
              >
                <Square size={16} />
                Arrêter
              </button>
            )}
          </div>

          {frenchVoices.length > 0 && (
            <>
              <label className="flex items-center gap-2 text-sm">
              Voix de narration
              <select
                value={autoNarratorVoiceURI}
                onChange={(e) => setNarratorVoiceURI(e.target.value)}
                className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
              >
                {frenchVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              </label>

            <label className="flex items-center gap-2 text-sm">
              Voix des dialogues
              <select
                value={autoDialogueVoiceURI}
                onChange={(e) => setDialogueVoiceURI(e.target.value)}
                className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
              >
                {frenchVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              </label>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm" aria-label="Navigation entre les pages">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="rounded-md border border-black/15 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20"
              >
                Précédente
              </button>
              <span className="tabular-nums">
                Page {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="rounded-md border border-black/15 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20"
              >
                Suivante
              </button>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            Vitesse
            <input
              type="range"
              min={RATE_MIN}
              max={RATE_MAX}
              step={RATE_STEP}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <span className="tabular-nums">{rate.toFixed(1)}x</span>
          </label>
        </div>
      )}

      <div ref={containerRef} className="flex flex-col gap-4 text-base leading-relaxed" />
    </div>
  );
}
