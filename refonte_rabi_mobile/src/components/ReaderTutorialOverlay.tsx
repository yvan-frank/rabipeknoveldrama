import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

interface ReaderTutorialOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

const STEPS = [
  {
    key: 'swipe',
    title: 'Tournez les pages en glissant',
    description: "Comme les pages d'un vrai livre : glissez vers la gauche pour avancer, vers la droite pour revenir en arrière.",
  },
  {
    key: 'tap',
    title: 'Une lecture immersive',
    description: "Touchez l'écran pour masquer les commandes et profiter du texte en plein écran. Touchez à nouveau pour les faire réapparaître.",
  },
  {
    key: 'bottombar',
    title: "Tout est en bas de l'écran",
    description: 'Trois raccourcis toujours à portée : la liste des chapitres, l’affichage (Aa) et les commentaires.',
  },
  {
    key: 'ready',
    title: 'Vous êtes prêt(e)',
    description: 'Installez-vous confortablement — le reste se découvre en lisant.',
  },
] as const;

// -- Illustration "glisser pour tourner la page" -----------------------------
// Déclarée au niveau module (pas dans ReaderTutorialOverlay) : cf. lint
// react-hooks/static-components rencontré plus tôt sur ce fichier de lecteur.
function SwipeHintIllustration({ accent }: { accent: string }) {
  const [handX] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(handX, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.delay(200),
        Animated.timing(handX, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(300),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [handX]);

  const translateX = handX.interpolate({ inputRange: [0, 1], outputRange: [36, -36] });
  const opacity = handX.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={illustrationStyles.stage}>
      <View style={[illustrationStyles.ghostPage, { right: 14 }]} />
      <View style={illustrationStyles.page}>
        <View style={[illustrationStyles.textBar, { width: '70%' }]} />
        <View style={[illustrationStyles.textBar, { width: '90%' }]} />
        <View style={[illustrationStyles.textBar, { width: '55%' }]} />
      </View>
      <Animated.View style={[illustrationStyles.handWrap, { opacity, transform: [{ translateX }] }]}>
        <Ionicons name="hand-left" size={30} color={accent} />
      </Animated.View>
    </View>
  );
}

// -- Illustration "toucher pour masquer/afficher les commandes" -------------
function TapHintIllustration({ accent, ink }: { accent: string; ink: string }) {
  const [chromeOpacity] = useState(() => new Animated.Value(1));
  const [ripple] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(chromeOpacity, { toValue: 0.12, duration: 380, useNativeDriver: true }),
          Animated.timing(ripple, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
        Animated.delay(500),
        Animated.timing(chromeOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(ripple, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [chromeOpacity, ripple]);

  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.8] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.15, 0] });

  return (
    <View style={illustrationStyles.stage}>
      <View style={illustrationStyles.phoneFrame}>
        <Animated.View style={[illustrationStyles.phoneBar, { opacity: chromeOpacity, backgroundColor: ink }]} />
        <View style={illustrationStyles.phoneBody}>
          <Animated.View
            pointerEvents="none"
            style={[illustrationStyles.tapRipple, { borderColor: accent, opacity: rippleOpacity, transform: [{ scale: rippleScale }] }]}
          />
          <Ionicons name="finger-print-outline" size={26} color={accent} />
        </View>
        <Animated.View style={[illustrationStyles.phoneBar, { opacity: chromeOpacity, backgroundColor: ink }]} />
      </View>
    </View>
  );
}

// -- Illustration des 3 raccourcis de la barre du bas ------------------------
const BOTTOM_HINT_ITEMS = [
  { icon: 'list' as const, label: 'Chapitres' },
  { icon: 'text' as const, label: 'Affichage' },
  { icon: 'chatbubble-ellipses' as const, label: 'Commentaires' },
];

function BottomBarHintIllustration({ accent, ink, muted }: { accent: string; ink: string; muted: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setActiveIndex((i) => (i + 1) % BOTTOM_HINT_ITEMS.length), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[illustrationStyles.stage, { flexDirection: 'row', justifyContent: 'center', gap: 22 }]}>
      {BOTTOM_HINT_ITEMS.map((item, index) => {
        const active = index === activeIndex;
        return (
          <View key={item.icon} style={illustrationStyles.hintColumn}>
            <View style={[illustrationStyles.hintIconWrap, active && { backgroundColor: accent, transform: [{ scale: 1.08 }] }]}>
              <Ionicons name={item.icon} size={20} color={active ? '#fff' : ink} />
            </View>
            <Text style={[illustrationStyles.hintLabel, { color: active ? accent : muted }]}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ReadyIllustration({ accent }: { accent: string }) {
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.5] });

  return (
    <View style={illustrationStyles.stage}>
      <Animated.View style={[illustrationStyles.readyGlow, { backgroundColor: accent, opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <Ionicons name="sparkles" size={40} color={accent} />
    </View>
  );
}

export function ReaderTutorialOverlay({ visible, onDismiss }: ReaderTutorialOverlayProps) {
  const { colors, spacing, typography } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const [contentOpacity] = useState(() => new Animated.Value(1));

  // Repart du début à chaque nouvelle ouverture (pas seulement au montage,
  // vu que ce composant reste monté même quand `visible` redevient false) —
  // ajustement pendant le rendu plutôt qu'un effet, cf. BottomSheet.tsx.
  const [renderedVisible, setRenderedVisible] = useState(visible);
  if (visible !== renderedVisible) {
    setRenderedVisible(visible);
    if (visible) {
      setStepIndex(0);
      contentOpacity.setValue(1);
    }
  }

  function goToStep(next: number) {
    Animated.timing(contentOpacity, { toValue: 0, duration: 130, useNativeDriver: true }).start(() => {
      setStepIndex(next);
      Animated.timing(contentOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }

  const isLast = stepIndex === STEPS.length - 1;
  const step = STEPS[stepIndex];

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onDismiss}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#0B0E14', '#11151F', '#0B0E14']} style={StyleSheet.absoluteFill} />
        <View style={[tutorialStyles.glow, { top: -70, left: -60, backgroundColor: `${colors.accent}33` }]} />
        <View style={[tutorialStyles.glow, { bottom: -90, right: -70, backgroundColor: `${colors.accent}22` }]} />

        <SafeAreaView style={{ flex: 1 }}>
          <View style={[tutorialStyles.topRow, { paddingHorizontal: spacing.lg }]}>
            <View />
            <Pressable onPress={onDismiss} hitSlop={10}>
              <Text style={[typography.captionSemiBold, { color: 'rgba(255,255,255,0.6)' }]}>Passer</Text>
            </Pressable>
          </View>

          <View style={tutorialStyles.center}>
            <Animated.View style={{ opacity: contentOpacity, alignItems: 'center', width: '100%' }}>
              {step.key === 'swipe' ? <SwipeHintIllustration accent={colors.accent} /> : null}
              {step.key === 'tap' ? <TapHintIllustration accent={colors.accent} ink="#FFFFFF" /> : null}
              {step.key === 'bottombar' ? (
                <BottomBarHintIllustration accent={colors.accent} ink="#FFFFFF" muted="rgba(255,255,255,0.55)" />
              ) : null}
              {step.key === 'ready' ? <ReadyIllustration accent={colors.accent} /> : null}

              <Text style={[typography.title, tutorialStyles.title]}>{step.title}</Text>
              <Text style={[typography.body, tutorialStyles.description, { paddingHorizontal: spacing.xl }]}>{step.description}</Text>
            </Animated.View>
          </View>

          <View style={[tutorialStyles.bottom, { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }]}>
            <View style={tutorialStyles.dots}>
              {STEPS.map((s, index) => (
                <View
                  key={s.key}
                  style={[
                    tutorialStyles.dot,
                    { backgroundColor: index === stepIndex ? colors.accent : 'rgba(255,255,255,0.25)', width: index === stepIndex ? 18 : 6 },
                  ]}
                />
              ))}
            </View>
            <Pressable
              onPress={() => (isLast ? onDismiss() : goToStep(stepIndex + 1))}
              style={[tutorialStyles.cta, { backgroundColor: colors.accent }]}
            >
              <Text style={[typography.bodySemiBold, { color: '#1A1408' }]}>{isLast ? 'Commencer à lire' : 'Suivant'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const tutorialStyles = StyleSheet.create({
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', marginTop: 28, textAlign: 'center' },
  description: { color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginTop: 10 },
  bottom: { gap: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  cta: { borderRadius: 999, paddingVertical: 15, alignItems: 'center' },
});

const illustrationStyles = StyleSheet.create({
  stage: { height: 120, alignItems: 'center', justifyContent: 'center', width: '100%' },
  page: {
    width: 130,
    height: 96,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 14,
    justifyContent: 'center',
    gap: 8,
  },
  ghostPage: {
    position: 'absolute',
    width: 130,
    height: 90,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)' },
  handWrap: { position: 'absolute' },
  phoneFrame: {
    width: 96,
    height: 118,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneBar: { width: '100%', height: 8, borderRadius: 4 },
  phoneBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tapRipple: { position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 1.5 },
  hintColumn: { alignItems: 'center', width: 78 },
  hintIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  hintLabel: { fontSize: 11.5, textAlign: 'center' },
  readyGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 45 },
});
