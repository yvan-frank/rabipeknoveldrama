import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { formatPrice } from '../lib/format-price';
import { resolveAssetUrl } from '../lib/resolve-asset-url';
import type { BookCard } from '../api/books';

interface BookListItemProps {
  book: BookCard;
  onPress: () => void;
}

export function priceLabel(book: Pick<BookCard, 'isFree' | 'isPromotion' | 'promotionPrice' | 'price'>): string {
  if (book.isFree) return 'Gratuit';
  if (book.isPromotion && book.promotionPrice != null) return `${formatPrice(book.promotionPrice)} FCFA`;
  return `${formatPrice(book.price)} FCFA`;
}

export function BookListItem({ book, onPress }: BookListItemProps) {
  const { colors, spacing, radius, typography, shadow } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        shadow,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          marginBottom: spacing.md,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: colors.background, borderRadius: radius.md }]}>
        {book.cover ? <Image source={{ uri: resolveAssetUrl(book.cover) }} style={styles.coverImage} resizeMode="cover" /> : null}
      </View>

      <View style={{ flex: 1, marginLeft: spacing.md, justifyContent: 'center' }}>
        <Text style={[typography.heading, { color: colors.ink }]} numberOfLines={2}>
          {book.title}
        </Text>
        {book.author?.name ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 3 }]} numberOfLines={1}>
            {book.author.name}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 8 }}>
          <Text style={[typography.captionSemiBold, { color: colors.accent }]}>{priceLabel(book)}</Text>
          {book.isAdultOnly ? (
            <View style={[styles.badge, { backgroundColor: colors.dangerMuted }]}>
              <Text style={[typography.label, { color: colors.danger }]}>18+</Text>
            </View>
          ) : null}
          {book.isPromotion ? (
            <View style={[styles.badge, { backgroundColor: colors.accentMuted }]}>
              <Text style={[typography.label, { color: colors.accent }]}>PROMO</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  cover: { width: 68, height: 96, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
});
