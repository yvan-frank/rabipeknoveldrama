import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { priceLabel } from './BookListItem';
import { resolveAssetUrl } from '../lib/resolve-asset-url';
import { useTheme } from '../theme/useTheme';
import type { BookCard } from '../api/books';

// Omit<BookCard, 'isAdultOnly'> plutôt que BookCard : ce composant n'utilise
// jamais isAdultOnly, ce qui le rend aussi utilisable avec TopRatedBookCard
// (cf. librairie.tsx) sans mapping superflu.
type ShelfBook = Omit<BookCard, 'isAdultOnly'>;

interface PosterShelfProps {
  title: string;
  books: ShelfBook[];
  onPressBook: (slug: string) => void;
}

function PosterCard({ book, onPress }: { book: ShelfBook; onPress: () => void }) {
  const { colors, radius, typography, shadow } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [shadow, { transform: [{ scale: pressed ? 0.96 : 1 }], marginRight: 14 }]}>
      <View style={[styles.card, { borderRadius: radius.md, backgroundColor: colors.surface }]}>
        {book.cover ? <Image source={{ uri: resolveAssetUrl(book.cover) }} style={styles.cover} resizeMode="cover" /> : null}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />
        {book.isPromotion ? (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={[typography.label, { color: colors.surface }]}>PROMO</Text>
          </View>
        ) : null}
        <View style={styles.overlay}>
          <Text style={[typography.captionSemiBold, { color: '#FFFFFF' }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={[typography.label, { color: 'rgba(255,255,255,0.8)', marginTop: 3 }]}>{priceLabel(book)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function PosterShelf({ title, books, onPressBook }: PosterShelfProps) {
  const { colors, spacing, typography } = useTheme();
  if (!books.length) return null;

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={[typography.heading, { color: colors.ink, marginBottom: spacing.sm }]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {books.map((book) => (
          <PosterCard key={book.id} book={book} onPress={() => onPressBook(book.slug)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 132, height: 188, overflow: 'hidden' },
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  overlay: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 },
});
