import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { useTheme } from '../theme/useTheme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Boîte de confirmation maison (Modal + Animated natifs, même construction
// que BottomSheet.tsx) plutôt que l'Alert.alert natif de l'OS : reprend les
// formes arrondies, couleurs et typographie de l'app au lieu de l'apparence
// générique du système.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const [scale] = useState(() => new Animated.Value(0.92));
  const [opacity] = useState(() => new Animated.Value(0));
  const [isMounted, setIsMounted] = useState(visible);
  // Ajustement pendant le rendu plutôt que dans un effet (cf. BottomSheet.tsx
  // pour le même motif et sa justification).
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

  return (
    <Modal transparent visible animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[shadow, styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg + 10, opacity, transform: [{ scale }] }]}
        >
          {destructive ? (
            <View style={[styles.iconWrap, { backgroundColor: colors.dangerMuted, marginBottom: spacing.md }]}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </View>
          ) : null}
          <Text style={[typography.heading, { color: colors.ink, textAlign: 'center' }]}>{title}</Text>
          {message ? (
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>{message}</Text>
          ) : null}
          <View style={[styles.actions, { marginTop: spacing.xl }]}>
            <View style={{ flex: 1 }}>
              <Button label={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} loading={loading} />
            </View>
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
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
});
