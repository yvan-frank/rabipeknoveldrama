import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PosterGridCard, GRID_CARD_WIDTH } from '../../../src/components/PosterGridCard';
import { PosterShelf } from '../../../src/components/PosterShelf';
import { fetchBooks, fetchTopRatedBooks, type BookCard } from '../../../src/api/books';
import { fetchCategories } from '../../../src/api/categories';
import { resolveAssetUrl } from '../../../src/lib/resolve-asset-url';
import { useTheme } from '../../../src/theme/useTheme';

const POPULAR_COUNT = 6;

// Onglet de découverte façon vitrine (étagère "Meilleurs romans" + classement
// "Populaires"), distinct de l'Accueil (fil défilant du catalogue complet) et
// de Bibliothèque (livres déjà possédés par l'utilisateur). "Découvrir" +
// catégories réelles (cf. fetchCategories) en onglets soulignés ; pas de tri
// "popularité" côté backend (cf. books.service.ts, seul /books/top-rated
// existe) donc la section "Populaires" reprend simplement les premiers
// résultats du catalogue, numérotés — pas de métrique inventée.
function GenreTab({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors, typography } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.genreTab}>
      <Text style={[selected ? typography.bodySemiBold : typography.body, { color: selected ? colors.ink : colors.textMuted }]}>{label}</Text>
      <View style={[styles.genreTabUnderline, { width: selected ? 22 : 0, backgroundColor: colors.accent }]} />
    </Pressable>
  );
}

function PopularBookCard({ book, rank, onPress }: { book: BookCard; rank: number; onPress: () => void }) {
  const { colors, radius, spacing, typography } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.popularCard}>
      <View style={styles.popularCover}>
        <View style={[styles.popularCoverInner, { borderRadius: radius.sm, backgroundColor: colors.surface }]}>
          {book.cover ? <Image source={{ uri: resolveAssetUrl(book.cover) }} style={styles.popularCoverImage} resizeMode="cover" /> : null}
        </View>
        <View style={[styles.rankBadge, { backgroundColor: colors.accent }]}>
          <Text style={[typography.label, { color: colors.surface, fontSize: 10 }]}>{rank}</Text>
        </View>
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={[typography.captionSemiBold, { color: colors.ink }]} numberOfLines={2}>
          {book.title}
        </Text>
        {book.category?.name ? (
          <View style={[styles.tag, { backgroundColor: colors.accentMuted, marginTop: 6 }]}>
            <Text style={[typography.label, { color: colors.accent }]} numberOfLines={1}>
              {book.category.name}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function LibrairieScreen() {
  const { colors, spacing, typography } = useTheme();
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const topRatedQuery = useQuery({ queryKey: ['books', 'top-rated', 'librairie'], queryFn: () => fetchTopRatedBooks(6) });
  const popularQuery = useQuery({
    queryKey: ['books', 'popular'],
    queryFn: () => fetchBooks({ page: 1, pageSize: POPULAR_COUNT }),
    enabled: categoryId === null,
  });
  const categoryBooksQuery = useQuery({
    queryKey: ['books', 'by-category', categoryId],
    queryFn: () => fetchBooks({ categoryId: categoryId ?? undefined, page: 1, pageSize: 20 }),
    enabled: categoryId !== null,
  });

  function goToBook(slug: string) {
    router.push(`/book/${slug}`);
  }

  function goToSearch() {
    router.push('/search');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView edges={['top']} style={{ paddingHorizontal: spacing.lg }}>
        <Text style={[typography.title, { color: colors.ink, marginTop: spacing.sm }]}>Librairie</Text>

        <Pressable onPress={goToSearch} style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <Text style={[typography.body, { color: colors.textMuted, marginLeft: 8 }]}>Rechercher...</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.lg }}
          contentContainerStyle={{ paddingBottom: spacing.sm }}
        >
          <GenreTab label="Découvrir" selected={categoryId === null} onPress={() => setCategoryId(null)} />
          {(categoriesQuery.data ?? []).map((category) => (
            <GenreTab key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {categoryId === null ? (
          <>
            <PosterShelf title="Meilleurs romans 🏅" books={topRatedQuery.data ?? []} onPressBook={goToBook} />

            <Text style={[typography.heading, { color: colors.ink, marginBottom: spacing.md }]}>Populaires 🔥</Text>
            {popularQuery.isLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <View style={styles.popularGrid}>
                {(popularQuery.data?.items ?? []).map((book, index) => (
                  <PopularBookCard key={book.id} book={book} rank={index + 1} onPress={() => goToBook(book.slug)} />
                ))}
              </View>
            )}
          </>
        ) : categoryBooksQuery.isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (categoryBooksQuery.data?.items.length ?? 0) === 0 ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>Aucun livre dans cette catégorie pour le moment.</Text>
        ) : (
          <View style={styles.categoryGrid}>
            {(categoryBooksQuery.data?.items ?? []).map((book) => (
              <View key={book.id} style={{ width: GRID_CARD_WIDTH, marginBottom: spacing.lg }}>
                <PosterGridCard book={book} onPress={() => goToBook(book.slug)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, height: 44 },
  genreTab: { alignItems: 'center', marginRight: 24 },
  genreTabUnderline: { height: 3, borderRadius: 2, marginTop: 6 },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  popularCard: { width: '48%', flexDirection: 'row', marginBottom: 20 },
  popularCover: { width: 64, height: 92 },
  popularCoverInner: { width: '100%', height: '100%', overflow: 'hidden' },
  popularCoverImage: { width: '100%', height: '100%' },
  rankBadge: { position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
