import { useColorScheme } from 'react-native';
import { cardShadow, fontFamily, palette, radius, spacing, typography } from './tokens';
import { useThemePreferenceStore } from './theme-preference-store';

export function useTheme() {
  const systemScheme = useColorScheme();
  const preference = useThemePreferenceStore((state) => state.preference);
  const scheme = preference === 'system' ? (systemScheme ?? 'light') : preference;
  const colors = scheme === 'dark' ? palette.dark : palette.light;
  return { colors, spacing, radius, typography, fontFamily, shadow: cardShadow(colors.shadow), scheme };
}
