import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  // Coins pleinement arrondis (pilule) plutôt que le radius.md habituel —
  // opt-in, cf. écrans d'auth qui reprennent ce style spécifiquement.
  pill?: boolean;
}

export function Button({ label, onPress, loading, disabled, variant = 'primary', pill }: ButtonProps) {
  const { colors, spacing, radius, fontFamily } = useTheme();
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const tint = isDanger ? colors.danger : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary || isDanger ? tint : 'transparent',
          borderColor: tint,
          borderWidth: isPrimary || isDanger ? 0 : 1,
          paddingVertical: spacing.md,
          borderRadius: pill ? radius.pill : radius.md,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          opacity: disabled || loading ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary || isDanger ? colors.surface : tint} />
      ) : (
        <Text style={[styles.label, { fontFamily: fontFamily.sansSemiBold, color: isPrimary || isDanger ? colors.surface : tint }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16 },
});
