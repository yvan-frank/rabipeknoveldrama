import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

interface AuthHeroProps {
  tagline: string;
}

// En-tête décoratif des écrans de connexion/inscription : blobs pastel
// (couleurs de marque, cf. tokens.ts) + logo, plein bord — d'où le
// contournement de ScreenContainer (qui impose un padding partout) dans
// login.tsx/register.tsx au profit d'une mise en page manuelle.
export function AuthHero({ tagline }: AuthHeroProps) {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 32 }]}>
      <View style={[styles.blob, styles.blobA, { backgroundColor: colors.accentMuted }]} />
      <View style={[styles.blob, styles.blobB, { backgroundColor: colors.loveMuted }]} />
      <View style={[styles.blob, styles.blobC, { backgroundColor: colors.accentMuted }]} />
      <Image source={require('../../assets/rabipek-logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={[typography.bodySemiBold, { color: colors.ink, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.xl }]}>
        {tagline}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingBottom: 28, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobA: { width: 220, height: 220, top: -110, left: -80, opacity: 0.6 },
  blobB: { width: 180, height: 180, top: -70, right: -90, opacity: 0.5 },
  blobC: { width: 140, height: 140, top: 100, left: -55, opacity: 0.35 },
  logo: { width: 170, height: 170 },
});
