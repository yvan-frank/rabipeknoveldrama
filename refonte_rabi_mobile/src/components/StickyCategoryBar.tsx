import { Animated, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryChip } from './CategoryChip';
import { useTheme } from '../theme/useTheme';
import type { CategorySummary } from '../api/books';

interface StickyCategoryBarProps {
  categories: CategorySummary[];
  categoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  onPressSearch: () => void;
  opacity: Animated.AnimatedInterpolation<number>;
  pointerEvents: 'auto' | 'none';
}

// Remplace intégralement la zone du héro/salutation une fois qu'on a scrollé
// jusqu'aux catégories (cf. index.tsx pour le calcul du seuil) : bascule
// nette plutôt qu'un fondu progressif, pour un effet "remplacement" net.
export function StickyCategoryBar({ categories, categoryId, onSelectCategory, onPressSearch, opacity, pointerEvents }: StickyCategoryBarProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[
        styles.bar,
        { opacity, paddingTop: insets.top + spacing.sm, backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, alignItems: 'center' }}
        style={{ paddingBottom: spacing.sm }}
      >
        <Pressable onPress={onPressSearch} hitSlop={10} style={[styles.searchButton, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={17} color={colors.ink} />
        </Pressable>
        <CategoryChip label="Tous" selected={categoryId === null} onPress={() => onSelectCategory(null)} />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            selected={categoryId === category.id}
            onPress={() => onSelectCategory(category.id)}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 21, borderBottomWidth: StyleSheet.hairlineWidth },
  searchButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
});
