import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'love';
  // Coins pleinement arrondis (pilule) plutôt que le radius.md habituel —
  // opt-in, cf. écrans d'auth qui reprennent ce style spécifiquement.
  pill?: boolean;
  // Badge circulaire blanc à gauche du label — boutons de connexion sociale
  // (cf. (auth)/index.tsx "Continuer avec Google").
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Button({ label, onPress, loading, disabled, variant = 'primary', pill, icon }: ButtonProps) {
  const { colors, spacing, radius, fontFamily } = useTheme();
  const isFilled = variant === 'primary' || variant === 'danger' || variant === 'love';
  const tint = variant === 'danger' ? colors.danger : variant === 'love' ? colors.love : colors.accent;
  const foreground = isFilled ? colors.surface : tint;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isFilled ? tint : 'transparent',
          borderColor: tint,
          borderWidth: isFilled ? 0 : 1,
          paddingVertical: spacing.md,
          borderRadius: pill ? radius.pill : radius.md,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          opacity: disabled || loading ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : icon ? (
        // Icône à gauche + label vraiment centré : un spacer de même largeur
        // à droite compense l'icône plutôt qu'un simple `justifyContent:center`
        // (qui décalerait le label vers la droite).
        <View style={styles.row}>
          <View style={[styles.iconBadge, { backgroundColor: colors.surface }]}>
            <Ionicons name={icon} size={16} color={tint} />
          </View>
          <Text style={[styles.label, styles.labelWithIcon, { fontFamily: fontFamily.sansSemiBold, color: foreground }]}>
            {label}
          </Text>
          <View style={styles.iconBadge} />
        </View>
      ) : (
        <Text style={[styles.label, { fontFamily: fontFamily.sansSemiBold, color: foreground }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 18 },
  iconBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16 },
  labelWithIcon: { flex: 1, textAlign: 'center' },
});
