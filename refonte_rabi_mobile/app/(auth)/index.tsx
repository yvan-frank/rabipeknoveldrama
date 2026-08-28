import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { extractApiErrorMessage } from '../../src/api/client';
import { useAuthStore } from '../../src/auth/auth-store';
import { useTheme } from '../../src/theme/useTheme';

// Écran d'entrée du parcours (auth) : porte d'accès avant login/register,
// affiché quand un visiteur tape "S'identifier" (bibliothèque, boîte de
// réception, bonus, compte...). Ne remplace pas login.tsx/register.tsx, qui
// restent les formulaires email/mot de passe accessibles via "Continuer avec
// Email" ci-dessous.
export default function AuthLandingScreen() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // false (annulé) ou true (connecté) : dans les deux cas rien à afficher
      // ici, (auth)/_layout redirige automatiquement vers /(app) au succès.
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Connexion Google impossible'));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {router.canGoBack() ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.back, { top: insets.top + 12, left: spacing.lg }]}
        >
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
      ) : null}

      <View style={[styles.hero, { paddingTop: insets.top + 72 }]}>
        <View style={[styles.blob, styles.blobA, { backgroundColor: colors.accentMuted }]} />
        <View style={[styles.blob, styles.blobB, { backgroundColor: colors.loveMuted }]} />
        <View style={[styles.blob, styles.blobC, { backgroundColor: colors.accentMuted }]} />

        <Image source={require('../../assets/rabipek-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[typography.hero, { color: colors.ink, marginTop: spacing.md }]}>RabipekNovel</Text>
        <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl }]}>
          Trouvez de belles histoires africaines sur RabipekNovel !
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}>
        <View style={{ gap: spacing.md }}>
          <Button
            label="Continuer avec Google"
            icon="logo-google"
            variant="love"
            pill
            loading={googleLoading}
            onPress={handleGoogle}
          />
        </View>

        {error ? (
          <Text style={[typography.caption, { color: colors.danger, textAlign: 'center', marginTop: spacing.md }]}>{error}</Text>
        ) : null}

        <Pressable onPress={() => router.push('/(auth)/login')} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Text style={[typography.bodySemiBold, { color: colors.accent }]}>Continuer avec Email</Text>
        </Pressable>

        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
          En continuant, vous acceptez les{' '}
          <Text style={{ color: colors.accent }} onPress={() => router.push('/cgv')}>
            Conditions d&apos;Utilisation
          </Text>{' '}
          et confirmez avoir lu la{' '}
          <Text style={{ color: colors.accent }} onPress={() => router.push('/politique-confidentialite')}>
            Politique de Confidentialité
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', zIndex: 1 },
  hero: { alignItems: 'center', paddingBottom: 32, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobA: { width: 240, height: 240, top: -110, left: -90, opacity: 0.6 },
  blobB: { width: 200, height: 200, top: -80, right: -100, opacity: 0.5 },
  blobC: { width: 160, height: 160, top: 140, left: -60, opacity: 0.3 },
  logo: { width: 120, height: 120 },
});
