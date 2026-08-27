import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { AuthHero } from '../../src/components/AuthHero';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { extractApiErrorMessage } from '../../src/api/client';
import { useAuthStore } from '../../src/auth/auth-store';
import { useTheme } from '../../src/theme/useTheme';

export default function LoginScreen() {
  const { colors, spacing, typography } = useTheme();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Email ou mot de passe incorrect'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Chevron manuel plutôt que le header natif de la Stack (auth) —
          headerShown reste à false (cf. (auth)/_layout.tsx) pour laisser
          AuthHero occuper tout le haut de l'écran sans bande de header. */}
      {router.canGoBack() ? (
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ position: 'absolute', top: 56, left: spacing.lg, zIndex: 1 }}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
      ) : null}

      {/* behavior 'height' sur Android (pas undefined) : sans ça le clavier
          recouvrait les champs de saisie sans repousser le contenu — même
          correctif que BottomSheet.tsx (panneau Commentaires). */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <AuthHero tagline="Connectez-vous pour retrouver votre bibliothèque." />

          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextField
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />

            {error ? (
              <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text>
            ) : null}

            <Button label="Se connecter" onPress={handleSubmit} loading={loading} disabled={!email || !password} pill />

            <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
              <Link href="/(auth)/register">
                <Text style={[typography.bodySemiBold, { color: colors.accent }]}>Créer un compte</Text>
              </Link>
            </View>

            <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl }]}>
              En continuant, vous acceptez la{' '}
              <Text style={{ color: colors.accent }} onPress={() => router.push('/politique-confidentialite')}>
                politique de confidentialité
              </Text>{' '}
              de Rabipek.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
