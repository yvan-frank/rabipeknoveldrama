import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationPreferenceState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

// Séparé de la permission OS (qu'on ne peut ni lire de façon fiable en continu
// ni révoquer depuis l'app) : ce booléen ne pilote que l'enregistrement/
// suppression du jeton push côté serveur (cf. app/_layout.tsx, qui réagit à
// ce store) — activé par défaut, cohérent avec le comportement déjà en place
// avant l'ajout de ce réglage.
export const useNotificationPreferenceStore = create<NotificationPreferenceState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: 'rabipek-notification-preference', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
