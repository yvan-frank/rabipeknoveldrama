import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

interface ToastState {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  show: (message: string, actionLabel?: string, onAction?: () => void) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  actionLabel: undefined,
  onAction: undefined,
  show: (message, actionLabel, onAction) => set({ visible: true, message, actionLabel, onAction }),
  hide: () => set({ visible: false }),
}));

const TOAST_DURATION_MS = 3200;

// Notification transitoire non bloquante (contrairement à showAlert, qui
// exige un tap pour se fermer) — utilisée pour les actions refusées à un
// visiteur (commenter, laisser un avis) : on ne veut pas interrompre sa
// lecture avec une modale, juste l'inviter à se connecter s'il le souhaite.
export function showToast(message: string, actionLabel?: string, onAction?: () => void) {
  useToastStore.getState().show(message, actionLabel, onAction);
}

// Monté une seule fois à la racine (cf. app/_layout.tsx), même motif que
// AppAlertHost : un <Modal> qui ne se crée qu'à l'affichage se superpose
// correctement à un BottomSheet déjà ouvert (ex. panneau Commentaires), les
// Modal natifs s'empilant dans leur ordre de montage.
export function ToastHost() {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { visible, message, actionLabel, onAction, hide } = useToastStore();
  const [translateY] = useState(() => new Animated.Value(40));
  const [opacity] = useState(() => new Animated.Value(0));
  const [isMounted, setIsMounted] = useState(visible);
  const [renderedVisible, setRenderedVisible] = useState(visible);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (visible !== renderedVisible) {
    setRenderedVisible(visible);
    if (visible) setIsMounted(true);
  }

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, mass: 0.8 }),
      ]).start();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(hide, TOAST_DURATION_MS);
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 40, duration: 140, useNativeDriver: true }),
      ]).start(() => setIsMounted(false));
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!isMounted) return null;

  function handleAction() {
    hide();
    onAction?.();
  }

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={hide}>
      <View style={styles.wrap} pointerEvents="box-none">
        <Animated.View
          style={[
            shadow,
            styles.toast,
            {
              backgroundColor: colors.ink,
              borderRadius: radius.lg,
              marginBottom: insets.bottom + spacing.lg,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Text style={[typography.body, { color: colors.background, flex: 1 }]}>{message}</Text>
          {actionLabel ? (
            <Pressable onPress={handleAction} hitSlop={8} style={{ marginLeft: spacing.md }}>
              <Text style={[typography.bodySemiBold, { color: colors.accent }]}>{actionLabel}</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 20 },
  toast: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, width: '100%', maxWidth: 420 },
});
