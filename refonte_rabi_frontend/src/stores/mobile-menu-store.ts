import { create } from 'zustand';

// Partagé entre MobileTopBar (bouton hamburger qui ouvre) et MobileMenuSheet
// (le panneau lui-même) — évite de faire remonter l'état par props entre deux
// composants qui ne sont pas parent/enfant direct (tous deux montés depuis
// layout.tsx).
interface MobileMenuStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useMobileMenuStore = create<MobileMenuStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
