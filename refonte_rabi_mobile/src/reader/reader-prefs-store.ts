import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ReaderThemeName } from '../theme/tokens';

// Préférences de confort de lecture uniquement (pas de session/secret) :
// AsyncStorage est adapté ici, contrairement aux tokens (cf. auth/token-storage.ts).
const FONT_SIZES = [15, 17, 19, 22, 26] as const;
const DEFAULT_FONT_SIZE_INDEX = 1;
const LINE_HEIGHTS = [1.5, 1.7, 1.9, 2.2] as const;
const DEFAULT_LINE_HEIGHT_INDEX = 1;
// Deux polices de lecture, comme demandé : une serif (confort de lecture
// longue) et une sans-serif (plus moderne/dense).
const READING_FONT_STACKS = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "-apple-system, Roboto, 'Segoe UI', sans-serif",
} as const;
export type ReadingFontChoice = keyof typeof READING_FONT_STACKS;
// "paginated" = feuilleter (colonnes CSS, swipe, pas de scroll) ; "scroll" =
// défiler classiquement. Choix explicite du lecteur dans le panneau Aa.
export type ReaderLayoutMode = 'paginated' | 'scroll';
const DIM_OPACITIES = [0, 0.15, 0.3, 0.45, 0.6] as const;
const DEFAULT_DIM_INDEX = 0;
// "light"/"dark" suivent déjà le thème système par défaut (cf. useReaderTheme) ;
// "sepia" et "paper" sont des choix explicites de confort de lecture, plus
// chauds qu'un simple mode clair, pensés pour de longues sessions de lecture.
const READER_THEMES: ReaderThemeName[] = ['light', 'dark', 'paper', 'sepia'];

interface ReaderPrefsState {
  fontSizeIndex: number;
  lineHeightIndex: number;
  themeOverride: ReaderThemeName | null;
  fontChoice: ReadingFontChoice;
  layoutMode: ReaderLayoutMode;
  dimIndex: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  increaseLineHeight: () => void;
  decreaseLineHeight: () => void;
  setThemeOverride: (theme: ReaderThemeName | null) => void;
  setFontChoice: (choice: ReadingFontChoice) => void;
  setLayoutMode: (mode: ReaderLayoutMode) => void;
  increaseDim: () => void;
  decreaseDim: () => void;
}

export const useReaderPrefsStore = create<ReaderPrefsState>()(
  persist(
    (set) => ({
      fontSizeIndex: DEFAULT_FONT_SIZE_INDEX,
      lineHeightIndex: DEFAULT_LINE_HEIGHT_INDEX,
      themeOverride: null,
      fontChoice: 'serif',
      layoutMode: 'paginated',
      dimIndex: DEFAULT_DIM_INDEX,
      increaseFontSize: () => set((state) => ({ fontSizeIndex: Math.min(state.fontSizeIndex + 1, FONT_SIZES.length - 1) })),
      decreaseFontSize: () => set((state) => ({ fontSizeIndex: Math.max(state.fontSizeIndex - 1, 0) })),
      increaseLineHeight: () => set((state) => ({ lineHeightIndex: Math.min(state.lineHeightIndex + 1, LINE_HEIGHTS.length - 1) })),
      decreaseLineHeight: () => set((state) => ({ lineHeightIndex: Math.max(state.lineHeightIndex - 1, 0) })),
      setThemeOverride: (theme) => set({ themeOverride: theme }),
      setFontChoice: (choice) => set({ fontChoice: choice }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      increaseDim: () => set((state) => ({ dimIndex: Math.min(state.dimIndex + 1, DIM_OPACITIES.length - 1) })),
      decreaseDim: () => set((state) => ({ dimIndex: Math.max(state.dimIndex - 1, 0) })),
    }),
    { name: 'rabipek-reader-prefs-v2', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function fontSizeFromIndex(index: number): number {
  return FONT_SIZES[index] ?? FONT_SIZES[DEFAULT_FONT_SIZE_INDEX];
}

export function lineHeightFromIndex(index: number): number {
  return LINE_HEIGHTS[index] ?? LINE_HEIGHTS[DEFAULT_LINE_HEIGHT_INDEX];
}

export function dimOpacityFromIndex(index: number): number {
  return DIM_OPACITIES[index] ?? DIM_OPACITIES[DEFAULT_DIM_INDEX];
}

export function fontStackFromChoice(choice: ReadingFontChoice): string {
  return READING_FONT_STACKS[choice];
}

export { FONT_SIZES, LINE_HEIGHTS, DIM_OPACITIES, READER_THEMES };
