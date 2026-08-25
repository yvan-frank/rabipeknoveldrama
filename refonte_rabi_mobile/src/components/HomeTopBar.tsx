import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

interface HomeTopBarProps {
  greeting: string;
  onPressSearch: () => void;
  opacity: Animated.AnimatedInterpolation<number>;
  pointerEvents: 'box-none' | 'none';
}

// Barre au-dessus du héro : reste visible tant qu'on n'a pas scrollé jusqu'aux
// catégories, où elle cède la place à StickyCategoryBar (cf. index.tsx pour
// le seuil de bascule). Fond en pastille semi-transparente : reste lisible
// sur l'image du héro.
export function HomeTopBar({ greeting, onPressSearch, opacity, pointerEvents }: HomeTopBarProps) {
  const { spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[styles.bar, { opacity, top: insets.top + spacing.sm, left: spacing.lg, right: spacing.lg }]}
    >
      {/* Toute la pastille est tappable (pas seulement l'icône loupe) : la
          salutation invite tout autant à chercher qu'à l'icône elle-même. */}
      <Pressable onPress={onPressSearch} style={styles.pill}>
        <Text style={[typography.caption, { color: '#FFFFFF' }]}>{greeting}</Text>
        <View style={styles.searchButton}>
          <Ionicons name="search" size={18} color="#FFFFFF" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', zIndex: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 6,
    height: 40,
  },
  searchButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
