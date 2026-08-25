import {
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';

// Couleurs de marque OFFICIELLES, identiques à refonte_rabi_frontend
// (globals.css: --color-brand-amber / --color-brand-pink) — mêmes valeurs en
// clair ET en sombre côté web, donc reprises telles quelles ici plutôt que
// déclinées par thème. amber = accent principal (CTA, marque, cf. Header.tsx
// "hover:text-brand-amber") ; pink = "cœur"/affection (cf. LikeButton.tsx
// "fill-brand-pink"), pas une couleur d'erreur — danger reste un vrai rouge,
// distinct de pink pour ne pas mélanger les deux sémantiques.
const BRAND_AMBER = '#F59E0B';
const BRAND_PINK = '#EB1983';

export const palette = {
  light: {
    background: '#F3F4F6',
    surface: '#FFFFFF',
    border: '#DCE1E7',
    ink: '#10161F',
    inkSecondary: '#212529',
    textMuted: '#5C6B7E',
    accent: BRAND_AMBER,
    accentMuted: '#FDECC8',
    love: BRAND_PINK,
    loveMuted: '#FBDCEB',
    danger: '#DC2626',
    dangerMuted: '#FBE2E2',
    success: '#2F7A6B',
    successMuted: '#DEEFEA',
    shadow: '#10161F',
  },
  dark: {
    background: '#09090B',
    surface: '#18181B',
    border: '#27272A',
    ink: '#EDEEF0',
    inkSecondary: '#D7DBE1',
    textMuted: '#aaabac',
    accent: BRAND_AMBER,
    accentMuted: '#3D2E10',
    love: BRAND_PINK,
    loveMuted: '#3A1A2C',
    danger: '#F87171',
    dangerMuted: '#3A1616',
    success: '#5FBBA9',
    successMuted: '#173430',
    shadow: '#000000',
  },
};

export type ThemeColors = typeof palette.light;

// Palettes de confort de lecture pour le lecteur de chapitres — distinctes du
// thème clair/sombre de l'app : "papier" est plus chaud que le clair standard
// (moins de fatigue oculaire sur un long texte), "sépia" imite le papier
// vieilli classique des liseuses.
export const readerPalette = {
  paper: { background: '#FBF7EE', ink: '#2A241C' },
  sepia: { background: '#F1E3C6', ink: '#3A2E1E' },
  light: { background: palette.light.background, ink: palette.light.ink },
  dark: { background: palette.dark.background, ink: palette.dark.ink },
};
export type ReaderThemeName = keyof typeof readerPalette;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
};

// Fraunces (serif éditorial, empattements marqués) pour les titres — nom du
// produit, fiches livres, sections d'accueil ; Public Sans pour l'UI/le corps
// de texte, plus neutre et lisible en petite taille. Même paire que le plan
// mobile (artifact "Plan Mobile Rabipek") pour une identité cohérente.
export const fontFamily = {
  displayRegular: 'Fraunces_500Medium',
  displaySemiBold: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_500Medium_Italic',
  sansRegular: 'PublicSans_400Regular',
  sansMedium: 'PublicSans_500Medium',
  sansSemiBold: 'PublicSans_600SemiBold',
  sansBold: 'PublicSans_700Bold',
};

// Polices à précharger via useFonts() dans app/_layout.tsx — un custom font
// chargé sous un nom précis ignore fontWeight (RN le "fake bold" au lieu de
// changer de fichier), donc chaque variante de graisse utilisée ci-dessus
// doit être déclarée ici individuellement.
export const fontsToLoad = {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_500Medium_Italic,
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
};

export const typography = {
  hero: { fontFamily: fontFamily.displayBold, fontSize: 30, lineHeight: 36 },
  title: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fontFamily.displaySemiBold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamily.sansRegular, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: fontFamily.sansMedium, fontSize: 16, lineHeight: 24 },
  bodySemiBold: { fontFamily: fontFamily.sansSemiBold, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fontFamily.sansMedium, fontSize: 11, lineHeight: 18 },
  captionSemiBold: { fontFamily: fontFamily.sansSemiBold, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.sansSemiBold, fontSize: 11.5, lineHeight: 15, letterSpacing: 0.5 },
};

// Élévation cross-platform (shadow* sur iOS, elevation sur Android) pour
// donner de la profondeur aux cartes plutôt que de simples bordures plates.
export function cardShadow(shadowColor: string) {
  return {
    shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  };
}
