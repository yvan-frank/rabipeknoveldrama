import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily } from '../theme/tokens';

interface MarketingSplashProps {
  // Passe à true une fois l'app réellement prête (fonts + bootstrap auth) ET
  // la durée minimale marketing écoulée (cf. RootLayout) — déclenche le
  // fondu de sortie plutôt qu'un cut brutal vers l'app.
  ready: boolean;
  onFinished: () => void;
}

const REVEAL_DURATION = 5000;
const EXIT_DURATION = 550;

// Écran d'accueil "teaser" façon bande-annonce, affiché entre le splash natif
// (logo nu, cf. app.config.ts) et l'app réelle. Remplace l'ancien écran de
// chargement neutre par un moment marketing : couverture de "Sabrina" (best-
// seller du catalogue) en plein cadre, Ken Burns lent, révélation du texte en
// cascade + jauge de progression réelle (5s, cf. RootLayout) — Animated natif
// (pas de reanimated/moti dans ce projet), tout sur useNativeDriver sauf la
// largeur de la jauge (StyleSheet width n'est pas transformable nativement).
export function MarketingSplash({ ready, onFinished }: MarketingSplashProps) {
  const insets = useSafeAreaInsets();

  const kenBurns = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(kenBurns, { toValue: 1, duration: 6500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

    Animated.timing(entrance, { toValue: 1, duration: 900, delay: 200, easing: Easing.out(Easing.exp), useNativeDriver: true }).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    glowLoop.start();

    Animated.timing(progress, { toValue: 1, duration: REVEAL_DURATION, easing: Easing.linear, useNativeDriver: false }).start();

    return () => glowLoop.stop();
  }, [kenBurns, entrance, glow, progress]);

  useEffect(() => {
    if (!ready) return;
    Animated.timing(exit, { toValue: 0, duration: EXIT_DURATION, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(
      ({ finished }) => finished && onFinished(),
    );
  }, [ready, exit, onFinished]);

  const imageScale = kenBurns.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1.28] });
  const imageTranslateX = kenBurns.interpolate({ inputRange: [0, 1], outputRange: [6, -10] });
  const badgeGlow = glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View
      pointerEvents={ready ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, styles.root, { opacity: exit }]}
    >
      <Animated.Image
        source={require('../../assets/splash-sabrina.jpg')}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ scale: imageScale }, { translateX: imageTranslateX }] },
        ]}
      />

      {/* Voile cinéma : assombrit uniformément pour la lisibilité du texte
          sans effacer la couverture, plus deux dégradés haut/bas pour ancrer
          logo et texte façon affiche de film. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(6,4,10,0.38)' }]} />
      <LinearGradient
        colors={['rgba(6,4,10,0.85)', 'rgba(6,4,10,0.05)', 'transparent']}
        style={styles.topFade}
      />
      <LinearGradient
        colors={['transparent', 'rgba(6,4,10,0.55)', 'rgba(6,4,10,0.96)']}
        style={styles.bottomFade}
      />

      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 }]}>
        <Animated.View
          style={{
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
          }}
        >
          <Text style={styles.brand}>RABIPEK</Text>
          <Text style={styles.brandSub}>NOVEL</Text>
        </Animated.View>

        <View style={styles.bottomBlock}>
          <Animated.View
            style={[
              styles.badge,
              {
                opacity: entrance,
                shadowOpacity: badgeGlow,
                transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
              },
            ]}
          >
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>À LA UNE · SABRINA</Text>
          </Animated.View>

          <Animated.Text
            style={[
              styles.tagline,
              {
                opacity: entrance,
                transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
              },
            ]}
          >
            Des histoires qui{'\n'}vous obsèdent.
          </Animated.Text>

          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: entrance.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] }),
                transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            Le nouveau roman événement de Rabipek
          </Animated.Text>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Animated.Text style={[styles.loadingLabel, { opacity: entrance }]}>Préparation de votre bibliothèque…</Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#06040A', zIndex: 50, elevation: 50 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 28 },
  brand: {
    fontFamily: fontFamily.sansBold,
    fontSize: 20,
    letterSpacing: 6,
    color: '#FFFFFF',
  },
  brandSub: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 12,
    letterSpacing: 8,
    color: '#F59E0B',
    marginTop: 2,
  },
  bottomBlock: { gap: 14 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.55)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EB1983' },
  badgeText: { fontFamily: fontFamily.sansSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: '#FFFFFF' },
  tagline: {
    fontFamily: fontFamily.displayBold,
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15,
    color: '#E9E4DD',
  },
  progressTrack: {
    marginTop: 10,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 999 },
  loadingLabel: { fontFamily: fontFamily.sansMedium, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
});
