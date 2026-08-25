import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BookCard } from '../api/books';

export interface RecentlyViewedEntry {
  book: BookCard;
  viewedAt: number;
}

// Local à l'appareil, jamais envoyé au serveur : c'est délibéré — le backend
// n'a aucune notion de visiteur anonyme (cf. auth.middleware.ts, seulement
// requireAuth/optionalAuth), donc un historique serveur ne pourrait de toute
// façon couvrir que les utilisateurs connectés. Le stockage local fonctionne
// identiquement pour un visiteur et un utilisateur connecté.
const MAX_ENTRIES = 40;

interface RecentlyViewedState {
  entries: RecentlyViewedEntry[];
  recordView: (book: BookCard) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      entries: [],
      recordView: (book) =>
        set((state) => {
          // Dédoublonne par slug et remonte en tête : revisiter un livre déjà
          // vu le fait remonter plutôt que de créer une deuxième entrée.
          const withoutBook = state.entries.filter((entry) => entry.book.slug !== book.slug);
          return { entries: [{ book, viewedAt: Date.now() }, ...withoutBook].slice(0, MAX_ENTRIES) };
        }),
      clear: () => set({ entries: [] }),
    }),
    { name: 'rabipek-recently-viewed', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
