'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, List, Type } from 'lucide-react';
import { paginateChapterHtml } from '@/lib/paginate-chapter';
import { saveContinueReading } from '@/lib/continue-reading';
import { ChapterListSheet } from './ChapterListSheet';
import { ChapterEndScreen } from './ChapterEndScreen';
import type { ChapterDetail, ChapterSummary } from '@/types/api';

interface ChapterReaderProps {
  chapter: ChapterDetail;
  chapters: ChapterSummary[];
  bookSlug: string;
  bookCover: string;
  isBookFree: boolean;
  freeChapterCount: number;
}

const SWIPE_THRESHOLD_PX = 50;

type FontSize = 'sm' | 'md' | 'lg';
const FONT_SIZE_STORAGE_KEY = 'rabipek-reader-font-size';
const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};
const FONT_SIZE_LABELS: Record<FontSize, string> = {
  sm: 'Petit',
  md: 'Moyen',
  lg: 'Grand',
};

// Ce composant n'est jamais rendu côté serveur (cf. ChapterReaderClientOnly,
// ssr:false) : lire localStorage directement dans l'initialiseur ne risque
// aucun mismatch d'hydratation.
function getInitialFontSize(): FontSize {
  if (typeof window === 'undefined') return 'md';
  const stored = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
  return stored === 'sm' || stored === 'md' || stored === 'lg' ? stored : 'md';
}

// Combinaisons bloquées pendant la lecture : copier/sélectionner tout/
// imprimer/enregistrer, plus les raccourcis d'ouverture des outils
// développeur. Best-effort — cf. note de sécurité dans le rendu ci-dessous.
function isBlockedShortcut(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && ['c', 'a', 'p', 's', 'u'].includes(e.key.toLowerCase())) return true;
  if (e.key === 'F12') return true;
  if (mod && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) return true;
  return false;
}

// Lecture immersive, paginée (axe A : découpage par nombre de mots, cf.
// lib/paginate-chapter.ts) — une page occupe la hauteur du viewport
// (`h-dvh`, plus fiable que `100vh` sur mobile). Navigation par tap
// gauche/droite, swipe, ou la liste des chapitres (bottom sheet). En bout de
// pagination, bascule automatiquement sur le chapitre suivant/précédent.
//
// ⚠️ Sécurité : la sélection/copie/impression/clic-droit/raccourcis clavier
// sont bloqués au mieux (dissuasion), mais un contenu HTML livré au
// navigateur reste par nature consultable via les outils développeur, la
// vue source ou l'onglet réseau — il n'existe pas de protection côté client
// qui empêche réellement l'extraction du texte. Ceci décourage la copie
// occasionnelle, ce n'est pas un verrou technique absolu.
export function ChapterReader({
  chapter,
  chapters,
  bookSlug,
  bookCover,
  isBookFree,
  freeChapterCount,
}: ChapterReaderProps) {
  const router = useRouter();
  // Ce composant n'est jamais rendu côté serveur (cf. ChapterReaderClientOnly,
  // ssr:false) : pas de risque de mismatch d'hydratation à dériver `pages`
  // directement au rendu plutôt que via un effect + setState.
  const pages = useMemo(() => paginateChapterHtml(chapter.content), [chapter.content]);
  const [currentPage, setCurrentPage] = useState(0);
  // Sens du dernier changement de page — pilote le sens de rotation de
  // l'effet "tournage de page" (cf. page-turn-next/prev dans globals.css).
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev'>('next');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [fontSize, setFontSizeState] = useState<FontSize>(getInitialFontSize);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isBlockedShortcut(e)) e.preventDefault();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Remonte en haut de page à chaque changement — sans ça, une page dont le
  // contenu déborde (bloc unique trop long, cf. paginate-chapter.ts) garde le
  // scroll de la page précédente au lieu de repartir du début.
  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0 });
  }, [currentPage]);

  // Bandeau "reprendre la lecture" (cf. ContinueReadingBanner) affiché sur
  // les autres pages publiques — la position est mise à jour dès qu'un
  // chapitre est effectivement ouvert, indépendamment de la page atteinte.
  useEffect(() => {
    saveContinueReading({
      bookSlug,
      bookTitle: chapter.book.title,
      bookCover,
      chapterNumber: chapter.chapterNumber,
      totalChapters: chapters.length,
    });
  }, [bookSlug, bookCover, chapter.book.title, chapter.chapterNumber, chapters.length]);

  function setFontSize(size: FontSize) {
    setFontSizeState(size);
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
  }

  const currentChapterIndex = chapters.findIndex((c) => c.id === chapter.id);
  const nextChapter = chapters[currentChapterIndex + 1];
  const prevChapter = chapters[currentChapterIndex - 1];
  // Un "écran de fin" virtuel après la dernière page — pas de bascule
  // silencieuse vers le chapitre suivant, on marque d'abord un arrêt pour
  // le fil de discussion (cf. ChapterEndScreen).
  const isEndScreen = currentPage === pages.length;

  function goNext() {
    if (currentPage < pages.length) {
      setTurnDirection('next');
      setCurrentPage((p) => p + 1);
    } else if (nextChapter) {
      router.push(`/livres/${bookSlug}/chapitres/${nextChapter.chapterNumber}`);
    }
  }

  function goPrev() {
    if (currentPage > 0) {
      setTurnDirection('prev');
      setCurrentPage((p) => p - 1);
    } else if (prevChapter) {
      router.push(`/livres/${bookSlug}/chapitres/${prevChapter.chapterNumber}`);
    }
  }

  // Tap gauche = page précédente, tap droit = page suivante. Un seul
  // handler sur le conteneur (pas de boutons superposés en absolute) pour ne
  // jamais bloquer le scroll interne d'une page trop longue. Désactivé sur
  // l'écran de fin : c'est un formulaire interactif, la navigation n'y passe
  // que par des boutons explicites.
  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (isEndScreen) return;
    if (isFontMenuOpen) {
      setIsFontMenuOpen(false);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    if (ratio < 0.35) goPrev();
    else goNext();
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (isEndScreen) return;
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (isEndScreen || touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goNext();
    else goPrev();
  }

  function preventCopyEvent(e: React.SyntheticEvent) {
    e.preventDefault();
  }

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative h-dvh w-full overflow-hidden bg-neutral-300 dark:bg-[#100e0c]"
    >
      {/* Environnement de lecture, suit le thème clair/sombre choisi (une
          feuille de papier claire ressort mal sur un fond blanc plat, d'où
          ce fond légèrement teinté même en mode clair). */}
      <div className="paper-sheet mx-auto my-2 h-[calc(100%-1rem)] max-w-2xl overflow-hidden rounded-lg sm:my-4 sm:h-[calc(100%-2rem)]">
        {/* Filigrane anti-copie : cercle discret centré, sous le texte.
            Couleur = encre de la page (var --paper-ink), suit donc le
            papier clair/sombre automatiquement. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] select-none"
          style={{ color: 'var(--paper-ink)' }}
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="2" />
          <text
            x="100"
            y="106"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fontFamily="var(--font-poppins)"
            fill="currentColor"
          >
            RABIPEK
          </text>
        </svg>

        {isEndScreen ? (
          <div key={`page-${currentPage}`} className={`h-full page-turn-${turnDirection}`}>
            <ChapterEndScreen
              chapterId={chapter.id}
              hasNextChapter={Boolean(nextChapter)}
              onGoToNextChapter={goNext}
            />
          </div>
        ) : (
          <div
            key={`page-${currentPage}`}
            ref={contentScrollRef}
            onCopy={preventCopyEvent}
            onCut={preventCopyEvent}
            onContextMenu={preventCopyEvent}
            onDragStart={preventCopyEvent}
            className={`paper-sheet-content font-serif relative h-full overflow-y-auto px-6 pt-[calc(env(safe-area-inset-top)_+_4rem)] pb-[calc(env(safe-area-inset-bottom)_+_4rem)] leading-relaxed [&>*]:mb-4 page-turn-${turnDirection} ${FONT_SIZE_CLASSES[fontSize]}`}
            dangerouslySetInnerHTML={{ __html: pages[currentPage] ?? '' }}
          />
        )}

        {/* Ombre de pli qui balaie la page pendant le tournage — rejouée à
            chaque changement de page via la key. */}
        <div key={`fold-${currentPage}`} className={`page-turn-fold page-turn-${turnDirection}`} aria-hidden />

        {/* Numéro de page, façon livre imprimé — fixe en pied de feuille,
            en dehors du bloc qui scrolle. Absent sur l'écran de fin. */}
        {!isEndScreen && pages.length > 0 && (
          <p
            className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-serif text-xs select-none"
            style={{ color: 'var(--paper-ink)', opacity: 0.5 }}
          >
            {currentPage + 1}
          </p>
        )}

        {/* Titre de chapitre en tête de chaque page, volontairement discret
            pour garder la priorité visuelle au contenu de lecture. */}
        {!isEndScreen && (
          <div
            className="pointer-events-none absolute inset-x-16 top-3 z-10 text-center font-serif select-none sm:inset-x-20 sm:top-4"
            style={{ color: 'var(--paper-ink)', opacity: 0.45 }}
            title={`Vous lisez actuellement : ${chapter.book.title} — ${chapter.title}`}
          >
            <p className="truncate text-[9px] tracking-[0.1em]">
              Vous lisez actuellement · {chapter.book.title}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-medium tracking-[0.12em]">
              {chapter.title}
            </p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-[calc(env(safe-area-inset-top)_+_0.75rem)]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/livres/${bookSlug}`);
          }}
          aria-label="Retour au livre"
          className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-black/10 text-black/80 shadow-lg backdrop-blur-md dark:bg-white/10 dark:text-white/90"
        >
          <ChevronLeft size={20} />
        </button>

        {!isEndScreen && (
          <div className="pointer-events-auto relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFontMenuOpen((v) => !v);
              }}
              aria-label="Taille du texte"
              className="flex size-9 items-center justify-center rounded-full bg-black/10 text-black/80 shadow-lg backdrop-blur-md dark:bg-white/10 dark:text-white/90"
            >
              <Type size={18} />
            </button>

            {isFontMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-11 right-0 flex flex-col gap-1 rounded-2xl bg-background/95 p-1.5 shadow-xl backdrop-blur-md"
              >
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setFontSize(size);
                      setIsFontMenuOpen(false);
                    }}
                    className={`rounded-xl px-4 py-2 text-left whitespace-nowrap transition ${
                      fontSize === size
                        ? 'bg-brand-amber/15 text-brand-amber'
                        : 'text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className={FONT_SIZE_CLASSES[size]}>{FONT_SIZE_LABELS[size]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-[calc(env(safe-area-inset-bottom)_+_0.75rem)]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSheetOpen(true);
          }}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/10 px-4 py-2 text-xs font-medium text-black/80 shadow-lg backdrop-blur-md dark:bg-white/10 dark:text-white/90"
        >
          <List size={14} />
          {isEndScreen
            ? `Chapitre ${chapter.chapterNumber} · Fin`
            : `Chapitre ${chapter.chapterNumber} · Page ${pages.length ? currentPage + 1 : 0}/${pages.length}`}
        </button>
      </div>

      <ChapterListSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        chapters={chapters}
        currentChapterId={chapter.id}
        bookTitle={chapter.book.title}
        onSelect={(chapterNumber) => {
          setIsSheetOpen(false);
          router.push(`/livres/${bookSlug}/chapitres/${chapterNumber}`);
        }}
        isBookFree={isBookFree}
        freeChapterCount={freeChapterCount}
      />
    </div>
  );
}
