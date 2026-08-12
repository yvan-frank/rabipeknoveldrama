import { create } from 'zustand';

// Permet aux pages dynamiques (titre d'un livre, d'un chapitre...) de
// renseigner le titre affiché par <MobileTopBar />, qui n'a sinon accès
// qu'à un mapping statique route -> titre (cf. lib/page-titles.ts).
interface PageTitleStore {
  title: string | null;
  setTitle: (title: string | null) => void;
}

export const usePageTitleStore = create<PageTitleStore>((set) => ({
  title: null,
  setTitle: (title) => set({ title }),
}));
