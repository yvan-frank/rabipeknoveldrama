import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { AnimatedAuthHero } from '../../src/components/AnimatedAuthHero';
import { ShimmerCta } from '../../src/components/ShimmerCta';
import { TextField } from '../../src/components/TextField';
import { extractApiErrorMessage } from '../../src/api/client';
import { useAuthStore } from '../../src/auth/auth-store';
import { useTheme } from '../../src/theme/useTheme';

// Petit utilitaire d'entrée "fade + slide up" échelonnée pour chaque bloc du
// formulaire (email / mot de passe / bouton / lien / mentions) — donne
// l'impression que l'écran "se dépose" plutôt que d'apparaître d'un bloc.
function useStaggeredEntrance(count: number, stagger = 90) {
  const values = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      stagger,
      values.map((value) =>
        Animated.spring(value, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
      ),
    ).start();
  }, [values, stagger]);
  return values.map((value) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  }));
}

export default function LoginScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [emailAnim, passwordAnim, buttonAnim, linkAnim, legalAnim] = useStaggeredEntrance(5);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!error) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.6, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -0.6, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [error, shake]);

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
          AnimatedAuthHero occuper tout le haut de l'écran sans bande de header. */}
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
          <AnimatedAuthHero tagline="Connectez-vous pour retrouver votre bibliothèque." />

          <View
            style={[
              shadow,
              {
                marginHorizontal: spacing.lg,
                marginTop: -spacing.lg,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
              },
            ]}
          >
            <Animated.View style={emailAnim}>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </Animated.View>

            <Animated.View style={passwordAnim}>
              <TextField
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
              />
            </Animated.View>

            {error ? (
              <Animated.Text
                style={[
                  typography.caption,
                  {
                    color: colors.danger,
                    marginBottom: spacing.md,
                    transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }) }],
                  },
                ]}
              >
                {error}
              </Animated.Text>
            ) : null}

            <Animated.View style={buttonAnim}>
              <ShimmerCta label="Se connecter" onPress={handleSubmit} loading={loading} disabled={!email || !password} />
            </Animated.View>

            <Animated.View style={[linkAnim, { marginTop: spacing.lg, alignItems: 'center' }]}>
              <Link href="/(auth)/register">
                <Text style={[typography.bodySemiBold, { color: colors.accent }]}>Créer un compte</Text>
              </Link>
            </Animated.View>
          </View>

          <Animated.Text
            style={[
              legalAnim,
              typography.caption,
              { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
            ]}
          >
            En continuant, vous acceptez la{' '}
            <Text style={{ color: colors.accent }} onPress={() => router.push('/politique-confidentialite')}>
              politique de confidentialité
            </Text>{' '}
            de Rabipek.
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
