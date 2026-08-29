import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Vérification d'âge pour le contenu 18+ (cf. book.isAdultOnly) — un simple
// tap "J'ai 18 ans ou plus" sans aucune donnée saisie ne constitue pas une
// véritable mesure d'assurance d'âge (revue Google Play, contenu généré par
// des tiers). L'année de naissance saisie ici sert uniquement au calcul
// local ; elle n'est jamais envoyée au serveur — seul le résultat booléen
// est mémorisé, pour ne pas redemander à chaque livre/ouverture d'app.
function computeIsAdult(birthYear: number): boolean {
  return new Date().getFullYear() - birthYear >= 18;
}

interface AgeVerificationState {
  isAdult: boolean;
  /** @returns false si l'année saisie correspond à moins de 18 ans (rien n'est mémorisé dans ce cas). */
  confirmBirthYear: (birthYear: number) => boolean;
}

export const useAgeVerificationStore = create<AgeVerificationState>()(
  persist(
    (set) => ({
      isAdult: false,
      confirmBirthYear: (birthYear) => {
        const isAdult = computeIsAdult(birthYear);
        if (isAdult) set({ isAdult: true });
        return isAdult;
      },
    }),
    { name: 'rabipek-age-verification', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
