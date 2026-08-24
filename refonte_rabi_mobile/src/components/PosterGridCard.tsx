import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { priceLabel } from './BookListItem';
import { resolveAssetUrl } from '../lib/resolve-asset-url';
import { palette } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import type { BookCard } from '../api/books';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_GAP = 14;
export const GRID_CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
// Toujours affiché sur un dégradé sombre par-dessus la couverture, quel que
// soit le thème courant : on reprend la teinte claire de l'accent (comme
// ContinueReadingBar) plutôt qu'une valeur figée qui a dérivé du reste de la
// palette lors du passage à l'identité couleurs du logo.
const OVERLAY_ACCENT = palette.light.accentMuted;

interface PosterGridCardProps {
  book: BookCard;
  onPress: () => void;
}

// Grille vitrine façon Apple Books : la couverture EST la carte, titre/auteur
// en surimpression sur un dégradé plutôt qu'à côté en texte — plus immersif
// qu'une ligne classique (cf. BookListItem, gardé pour d'autres contextes).
export function PosterGridCard({ book, onPress }: PosterGridCardProps) {
  const { colors, radius, typography, shadow } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [shadow, { width: GRID_CARD_WIDTH, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      <View style={[styles.card, { borderRadius: radius.lg, backgroundColor: colors.surface }]}>
        {book.cover ? <Image source={{ uri: resolveAssetUrl(book.cover) }} style={styles.cover} resizeMode="cover" /> : null}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} locations={[0.4, 1]} style={styles.gradient} />

        {book.isAdultOnly || book.isPromotion ? (
          <View style={styles.badgeRow}>
            {book.isPromotion ? (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={[typography.label, { color: colors.surface }]}>PROMO</Text>
              </View>
            ) : null}
            {book.isAdultOnly ? (
              <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                <Text style={[typography.label, { color: colors.surface }]}>18+</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.overlay}>
          <Text style={[typography.bodySemiBold, { color: '#FFFFFF' }]} numberOfLines={2}>
            {book.title}
          </Text>
          {book.author?.name ? (
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)', marginTop: 2 }]} numberOfLines={1}>
              {book.author.name}
            </Text>
          ) : null}
          <Text style={[typography.captionSemiBold, { color: OVERLAY_ACCENT, marginTop: 4 }]}>{priceLabel(book)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', aspectRatio: 0.68, overflow: 'hidden' },
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  badgeRow: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 },
  overlay: { position: 'absolute', left: 10, right: 10, bottom: 10 },
});
