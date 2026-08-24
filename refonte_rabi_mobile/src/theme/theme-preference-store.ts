import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 'system' = suit useColorScheme() (comportement par défaut, jamais touché) ;
// 'light'/'dark' = préférence explicite de l'utilisateur, posée dès qu'il
// bascule le switch dans Paramètres — cf. useTheme.ts pour la résolution.
export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemePreferenceState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemePreferenceStore = create<ThemePreferenceState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    { name: 'rabipek-theme-preference', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
