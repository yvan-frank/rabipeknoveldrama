import { useEffect, useState, type PropsWithChildren } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title?: string;
  maxHeightRatio?: number;
  // 'surface' (par défaut) : carte opaque classique (liste de chapitres,
  // réglages). 'transparent' : pas de carte du tout, le contenu flotte
  // directement sur le voile sombre du fond — cf. panneau Commentaires, qui
  // doit reprendre le fond translucide de la capture de référence plutôt
  // qu'une carte blanche/surface.
  variant?: 'surface' | 'transparent';
}

// Feuille modale maison (Modal + Animated natifs) plutôt qu'une librairie de
// bottom sheet tierce : évite d'ajouter react-native-gesture-handler/
// reanimated pour ce seul besoin (cf. décision prise plus tôt cette session
// de retirer Reanimated — risque de config sans appareil pour vérifier).
export function BottomSheet({ visible, onClose, title, maxHeightRatio = 0.85, variant = 'surface', children }: BottomSheetProps) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [translateY] = useState(() => new Animated.Value(screenHeight));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [isMounted, setIsMounted] = useState(visible);
  // Montage immédiat ajusté pendant le rendu (motif recommandé par React pour
  // "réagir à un changement de prop") — seule la fin de l'animation de
  // fermeture, elle, doit attendre un effet (cf. ci-dessous).
  const [renderedVisible, setRenderedVisible] = useState(visible);
  if (visible !== renderedVisible) {
    setRenderedVisible(visible);
    if (visible) setIsMounted(true);
  }

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, mass: 0.9 }),
      ]).start();
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: screenHeight, duration: 220, useNativeDriver: true }),
      ]).start(() => setIsMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!isMounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      {/* Sans ceci, le clavier recouvrait le champ de saisie des panneaux avec
          un TextInput (ex. commentaires) : le sheet est en position:absolute
          bottom:0, insensible au redimensionnement du clavier — on le passe
          donc en dernier enfant d'un conteneur flex "flex-end" à l'intérieur
          de KeyboardAvoidingView, qui le repousse au-dessus du clavier. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardWrap}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            variant === 'surface' ? shadow : null,
            styles.sheet,
            {
              backgroundColor: variant === 'surface' ? colors.surface : 'transparent',
              borderTopLeftRadius: variant === 'surface' ? radius.lg + 8 : 0,
              borderTopRightRadius: variant === 'surface' ? radius.lg + 8 : 0,
              maxHeight: screenHeight * maxHeightRatio,
              paddingBottom: insets.bottom + spacing.md,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: variant === 'surface' ? colors.border : 'rgba(255,255,255,0.4)' }]} />
          {title ? (
            <Text
              style={[
                typography.heading,
                { color: variant === 'surface' ? colors.ink : '#FFFFFF', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
              ]}
            >
              {title}
            </Text>
          ) : null}
          {/* Le contenu peut dépasser maxHeight (ex. longue liste de chapitres) :
              sans ScrollView ici, il était simplement tronqué sans pouvoir
              défiler. */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: spacing.sm }}>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  keyboardWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingTop: 10 },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
});
