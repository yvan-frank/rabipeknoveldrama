import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Un seul indicateur, persistant : le tuto du lecteur ne doit s'afficher
// qu'une fois, jamais aux chapitres suivants ni aux prochaines sessions.
interface ReaderOnboardingState {
  hasSeenReaderTutorial: boolean;
  markReaderTutorialSeen: () => void;
}

export const useReaderOnboardingStore = create<ReaderOnboardingState>()(
  persist(
    (set) => ({
      hasSeenReaderTutorial: false,
      markReaderTutorialSeen: () => set({ hasSeenReaderTutorial: true }),
    }),
    { name: 'rabipek-reader-onboarding-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
