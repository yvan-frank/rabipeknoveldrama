import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { PosterGridCard, GRID_CARD_WIDTH } from '../../src/components/PosterGridCard';
import { extractApiErrorMessage } from '../../src/api/client';
import { fetchBooks, type BookCard } from '../../src/api/books';
import { useTheme } from '../../src/theme/useTheme';

const PAGE_SIZE = 20;
const GRID_PADDING = 20;
const GRID_GAP = 14;
// Le champ de recherche ne déclenche l'appel API qu'après une courte pause de
// frappe — évite une requête à chaque lettre tapée.
const SEARCH_DEBOUNCE_MS = 400;

export default function SearchScreen() {
  const { colors, spacing, typography, fontFamily } = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Cette page est ouverte spécifiquement pour chercher : le clavier doit
  // être prêt immédiatement, pas de tap supplémentaire pour le champ.
  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const resultsQuery = useInfiniteQuery({
    queryKey: ['books', 'search', search],
    queryFn: ({ pageParam }) => fetchBooks({ page: pageParam, pageSize: PAGE_SIZE, search: search || undefined }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (allPages.length * PAGE_SIZE < lastPage.total ? allPages.length + 1 : undefined),
    enabled: search.length > 0,
  });

  const items: BookCard[] = resultsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  function goToBook(slug: string) {
    router.push(`/book/${slug}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <TextInput
          ref={inputRef}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Rechercher un titre ou un auteur"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={[
            styles.search,
            {
              fontFamily: fontFamily.sansRegular,
              borderColor: colors.border,
              color: colors.ink,
              backgroundColor: colors.surface,
            },
          ]}
        />
      </View>

      <FlatList
        data={items}
        numColumns={2}
        columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP, paddingHorizontal: GRID_PADDING }}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
        keyExtractor={(book) => String(book.id)}
        renderItem={({ item }) => <PosterGridCard book={item} onPress={() => goToBook(item.slug)} />}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (resultsQuery.hasNextPage && !resultsQuery.isFetchingNextPage) resultsQuery.fetchNextPage();
        }}
        ListEmptyComponent={
          search.length === 0 ? (
            <Text style={[typography.body, { color: colors.textMuted, paddingHorizontal: GRID_PADDING }]}>
              {"Tapez un titre ou un nom d'auteur pour commencer."}
            </Text>
          ) : resultsQuery.isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ width: GRID_CARD_WIDTH, marginLeft: GRID_PADDING }} />
          ) : resultsQuery.isError ? (
            <Text style={[typography.body, { color: colors.danger, paddingHorizontal: GRID_PADDING }]}>
              {extractApiErrorMessage(resultsQuery.error, 'Impossible de charger les résultats')}
            </Text>
          ) : (
            <Text style={[typography.body, { color: colors.textMuted, paddingHorizontal: GRID_PADDING }]}>
              Aucun livre ne correspond à « {search} ».
            </Text>
          )
        }
        ListFooterComponent={
          resultsQuery.isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
});
