import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { useTheme } from '../theme/useTheme';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertStoreState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  show: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hide: () => void;
}

const useAlertStore = create<AlertStoreState>((set) => ({
  visible: false,
  title: '',
  message: undefined,
  buttons: [],
  show: (title, message, buttons) =>
    set({ visible: true, title, message, buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }] }),
  hide: () => set({ visible: false }),
}));

// Remplace Alert.alert (React Native) partout dans l'app — même signature
// (titre, message, boutons) pour que chaque appel existant se remplace à
// l'identique, juste en changeant l'import. Un seul <AppAlertHost /> monté à
// la racine (cf. app/_layout.tsx) affiche l'alerte quel que soit l'écran
// d'où showAlert a été appelé.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  useAlertStore.getState().show(title, message, buttons);
}

function variantForButton(button: AlertButton, index: number, total: number): 'primary' | 'secondary' | 'danger' {
  if (button.style === 'destructive') return 'danger';
  if (button.style === 'cancel') return 'secondary';
  // 'default' (ou non précisé) : seul le dernier bouton est mis en avant —
  // reprend l'ordre déjà utilisé partout dans le code existant (annuler
  // d'abord, action posée en dernier).
  return index === total - 1 ? 'primary' : 'secondary';
}

export function AppAlertHost() {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const { visible, title, message, buttons, hide } = useAlertStore();
  const [scale] = useState(() => new Animated.Value(0.92));
  const [opacity] = useState(() => new Animated.Value(0));
  const [isMounted, setIsMounted] = useState(visible);
  // Même motif que ConfirmDialog/BottomSheet : ajustement pendant le rendu
  // pour le montage immédiat, effet seulement pour la fin de l'animation de fermeture.
  const [renderedVisible, setRenderedVisible] = useState(visible);
  if (visible !== renderedVisible) {
    setRenderedVisible(visible);
    if (visible) setIsMounted(true);
  }

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, mass: 0.8 }),
      ]).start();
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.92, duration: 120, useNativeDriver: true }),
      ]).start(() => setIsMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!isMounted) return null;

  function handlePress(button: AlertButton) {
    hide();
    button.onPress?.();
  }

  const stacked = buttons.length > 2;

  return (
    <Modal transparent visible animationType="none" onRequestClose={hide} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={hide} />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[shadow, styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg + 10, opacity, transform: [{ scale }] }]}
        >
          <Text style={[typography.heading, { color: colors.ink, textAlign: 'center' }]}>{title}</Text>
          {message ? (
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>{message}</Text>
          ) : null}
          <View style={[stacked ? styles.actionsStacked : styles.actions, { marginTop: spacing.xl }]}>
            {buttons.map((button, index) => (
              <View key={index} style={stacked ? undefined : { flex: 1 }}>
                <Button label={button.text} variant={variantForButton(button, index, buttons.length)} onPress={() => handlePress(button)} />
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { width: '100%', maxWidth: 340, padding: 24, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  actionsStacked: { flexDirection: 'column', gap: 10, width: '100%' },
});
