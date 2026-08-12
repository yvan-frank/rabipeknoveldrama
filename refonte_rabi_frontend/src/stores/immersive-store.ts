import { create } from 'zustand';

// Permet à une page non-immersive par route (ex. /inscription) de demander
// ponctuellement le mode immersif (masquer header/footer public) pour une
// partie de son contenu — ex. l'onboarding auteur en plein écran — sans
// changer la règle globale basée sur le pathname (cf. immersive-routes.ts).
interface ImmersiveOverrideStore {
  isForced: boolean;
  setForced: (forced: boolean) => void;
}

export const useImmersiveOverrideStore = create<ImmersiveOverrideStore>((set) => ({
  isForced: false,
  setForced: (forced) => set({ isForced: forced }),
}));
