import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

interface AnimatedAuthHeroProps {
  tagline: string;
}

// Variante animée d'AuthHero, réservée à l'écran de connexion (cf. login.tsx)
// pour ne pas alourdir register.tsx : dégradé de fond + blobs qui flottent en
// continu + logo qui entre en scène (spring) + halo pulsé derrière le logo.
// Animated (API native de RN) plutôt que reanimated/moti, absents du projet —
// tout tourne sur useNativeDriver (transform/opacity uniquement).
function useFloat(duration: number, distance: number, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value, duration, distance, delay]);
  return value.interpolate({ inputRange: [0, 1], outputRange: [0, distance] });
}

export function AnimatedAuthHero({ tagline }: AnimatedAuthHeroProps) {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const floatA = useFloat(4200, -16);
  const floatB = useFloat(5000, 14, 250);
  const floatC = useFloat(3600, 10, 600);

  const halo = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }).start();
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    haloLoop.start();
    return () => haloLoop.stop();
  }, [entrance, halo]);

  const logoScale = entrance.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 32 }]}>
      <LinearGradient
        colors={[colors.accentMuted, colors.background]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.blob, styles.blobA, { backgroundColor: colors.accentMuted, transform: [{ translateY: floatA }] }]} />
      <Animated.View style={[styles.blob, styles.blobB, { backgroundColor: colors.loveMuted, transform: [{ translateY: floatB }] }]} />
      <Animated.View style={[styles.blob, styles.blobC, { backgroundColor: colors.accentMuted, transform: [{ translateY: floatC }] }]} />

      <View style={styles.logoZone}>
        <Animated.View
          pointerEvents="none"
          style={[styles.halo, { backgroundColor: colors.accent, opacity: haloOpacity, transform: [{ scale: haloScale }] }]}
        />
        <Animated.Image
          source={require('../../assets/rabipek-logo.png')}
          style={[styles.logo, { opacity: entrance, transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
      </View>

      <Animated.Text
        style={[
          typography.bodySemiBold,
          {
            color: colors.ink,
            textAlign: 'center',
            marginTop: spacing.md,
            paddingHorizontal: spacing.xl,
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          },
        ]}
      >
        {tagline}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingBottom: 28, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobA: { width: 220, height: 220, top: -110, left: -80, opacity: 0.6 },
  blobB: { width: 180, height: 180, top: -70, right: -90, opacity: 0.5 },
  blobC: { width: 140, height: 140, top: 100, left: -55, opacity: 0.35 },
  logoZone: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 170, height: 170, borderRadius: 999 },
  logo: { width: 170, height: 170 },
});
