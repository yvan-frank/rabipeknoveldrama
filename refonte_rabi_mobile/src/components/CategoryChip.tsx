import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const { colors, spacing, fontFamily } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      <Text style={[styles.label, { fontFamily: fontFamily.sansSemiBold, color: selected ? colors.surface : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  label: { fontSize: 13 },
});
