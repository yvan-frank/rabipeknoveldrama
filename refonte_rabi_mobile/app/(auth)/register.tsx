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

export default function RegisterScreen() {
  const { colors, spacing, typography } = useTheme();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Inscription impossible'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {router.canGoBack() ? (
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ position: 'absolute', top: 56, left: spacing.lg, zIndex: 1 }}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <AuthHero tagline="Créez votre compte pour découvrir et lire vos romans préférés." />

          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <TextField label="Nom" value={name} onChangeText={setName} autoComplete="name" />
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
              autoComplete="new-password"
            />

            {error ? (
              <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text>
            ) : null}

            <Button
              label="Créer mon compte"
              onPress={handleSubmit}
              loading={loading}
              disabled={!name || !email || password.length < 8}
              pill
            />

            <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
              <Link href="/(auth)/login">
                <Text style={[typography.bodySemiBold, { color: colors.accent }]}>{"J'ai déjà un compte"}</Text>
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
