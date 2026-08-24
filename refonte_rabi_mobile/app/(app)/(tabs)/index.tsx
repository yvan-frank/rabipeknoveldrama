import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Animated, ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import { CategoryChip } from '../../../src/components/CategoryChip';
import { ContinueReadingBar } from '../../../src/components/ContinueReadingBar';
import { HomeHeroHeader, HERO_REVEAL_HEIGHT } from '../../../src/components/HomeHeroHeader';
import { HomeTopBar } from '../../../src/components/HomeTopBar';
import { StickyCategoryBar } from '../../../src/components/StickyCategoryBar';
import { PosterGridCard, GRID_CARD_WIDTH } from '../../../src/components/PosterGridCard';
import { PosterShelf } from '../../../src/components/PosterShelf';
import { extractApiErrorMessage } from '../../../src/api/client';
import { fetchBooks, fetchTopRatedBooks, type BookCard } from '../../../src/api/books';
import { fetchCategories } from '../../../src/api/categories';
import { fetchDashboard } from '../../../src/api/library';
import { useTheme } from '../../../src/theme/useTheme';

const PAGE_SIZE = 20;
const GRID_PADDING = 20;
const GRID_GAP = 14;

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Bonne nuit';
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function HomeScreen() {
  const { colors, spacing, typography } = useTheme();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  // Native driver : scrollY n'alimente que des transform/opacity (cf.
  // HomeHeroHeader, HomeTopBar, StickyCategoryBar) — aucun calcul JS dans la
  // boucle de scroll.
  const [scrollY] = useState(() => new Animated.Value(0));
  const listRef = useRef<Animated.FlatList<BookCard>>(null);
  // Position réelle de la rangée de catégories dans le contenu (mesurée via
  // onLayout ci-dessous) : le seuil de bascule du header sticky en dépend
  // directement plutôt que d'être une valeur devinée à l'avance.
  const [categoriesOffsetY, setCategoriesOffsetY] = useState(0);
  const [isPastSticky, setIsPastSticky] = useState(false);
  const stickyThresholdRef = useRef(0);

  const hasFilters = categoryId !== null;

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  // Barre "reprendre la lecture" flottante — le tri du dashboard place déjà
  // l'activité la plus récente en premier.
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });
  const continueReadingEntry = dashboardQuery.data?.library[0];
  const [continueBarVisibility] = useState(() => new Animated.Value(0));
  const lastScrollYRef = useRef(0);
  const topRatedQuery = useQuery({ queryKey: ['books', 'top-rated'], queryFn: () => fetchTopRatedBooks(5) });
  // Le tri par défaut de GET /books est createdAt desc (cf. books.service.ts) :
  // une simple première page suffit à représenter "Nouveautés", pas besoin
  // d'un paramètre de tri dédié côté API.
  const recentQuery = useQuery({
    queryKey: ['books', 'recent'],
    queryFn: () => fetchBooks({ page: 1, pageSize: 10 }),
    enabled: !hasFilters,
  });

  // useInfiniteQuery gère lui-même la ré-initialisation des pages quand la
  // clé change (catégorie) — pas besoin d'un effet manuel pour remettre
  // page/liste à zéro à chaque changement de filtre.
  const listQuery = useInfiniteQuery({
    queryKey: ['books', 'list', categoryId],
    queryFn: ({ pageParam }) => fetchBooks({ page: pageParam, pageSize: PAGE_SIZE, categoryId: categoryId ?? undefined }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (allPages.length * PAGE_SIZE < lastPage.total ? allPages.length + 1 : undefined),
  });

  const items: BookCard[] = listQuery.data?.pages.flatMap((page) => page.items) ?? [];

  // Seuil de bascule = position absolue de la rangée de catégories dans le
  // contenu défilable (espace transparent du héro + position mesurée dans la
  // "feuille" qui suit).
  const stickyThreshold = HERO_REVEAL_HEIGHT + categoriesOffsetY;

  useEffect(() => {
    stickyThresholdRef.current = stickyThreshold;
  }, [stickyThreshold]);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const past = value >= stickyThresholdRef.current;
      setIsPastSticky((current) => (current !== past ? past : current));

      // Barre "reprendre" : apparaît en scrollant vers le bas, disparaît en
      // remontant — jamais tout en haut, où le héro suffit déjà à l'écran.
      const delta = value - lastScrollYRef.current;
      lastScrollYRef.current = value;
      if (Math.abs(delta) < 4) return;
      const shouldShow = delta > 0 && value > 40;
      Animated.timing(continueBarVisibility, { toValue: shouldShow ? 1 : 0, duration: 220, useNativeDriver: true }).start();
    });
    return () => scrollY.removeListener(listenerId);
  }, [scrollY, continueBarVisibility]);

  // Bascule nette (1px de transition) plutôt qu'un long fondu : la barre du
  // haut cède la place aux catégories dès qu'on atteint leur position réelle.
  const topBarOpacity = scrollY.interpolate({
    inputRange: [stickyThreshold - 1, stickyThreshold],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const stickyBarOpacity = scrollY.interpolate({
    inputRange: [stickyThreshold - 1, stickyThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  function goToBook(slug: string) {
    router.push(`/book/${slug}`);
  }

  function goToSearch() {
    router.push('/search');
  }

  function handleCategoriesLayout(event: LayoutChangeEvent) {
    setCategoriesOffsetY(event.nativeEvent.layout.y);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Héro fixe, en fond (cf. HomeHeroHeader) : c'est le scroll natif de la
          liste ci-dessous qui le recouvre progressivement, pas une animation
          de hauteur — d'où l'espace transparent HERO_REVEAL_HEIGHT en tête de
          liste, à travers lequel l'image reste visible tant qu'on n'a pas
          scrollé. */}
      <HomeHeroHeader books={topRatedQuery.data ?? []} scrollY={scrollY} onPressBook={goToBook} />

      <Animated.FlatList
        ref={listRef}
        style={{ flex: 1, zIndex: 1, elevation: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        data={items}
        numColumns={2}
        columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP, paddingHorizontal: GRID_PADDING }}
        keyExtractor={(book) => String(book.id)}
        renderItem={({ item }) => <PosterGridCard book={item} onPress={() => goToBook(item.slug)} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) listQuery.fetchNextPage();
        }}
        ListHeaderComponent={
          <>
            <View style={{ height: HERO_REVEAL_HEIGHT }} pointerEvents="none" />
            <View
              //colors={[colors.surface, colors.background]}
              style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24, paddingHorizontal: GRID_PADDING,
              backgroundColor: colors.background}}
            >
              {!hasFilters ? <PosterShelf title="Nouveautés" books={recentQuery.data?.items ?? []} onPressBook={goToBook} /> : null}

              <View onLayout={handleCategoriesLayout}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
                  <CategoryChip label="Tous" selected={categoryId === null} onPress={() => setCategoryId(null)} />
                  {(categoriesQuery.data ?? []).map((category) => (
                    <CategoryChip
                      key={category.id}
                      label={category.name}
                      selected={categoryId === category.id}
                      onPress={() => setCategoryId(category.id)}
                    />
                  ))}
                </ScrollView>
              </View>

              <Text style={[typography.heading, { color: colors.ink, marginBottom: spacing.sm }]}>
                {hasFilters ? 'Résultats' : 'Catalogue'}
              </Text>

              {listQuery.isError ? (
                <Text style={[typography.body, { color: colors.danger }]}>
                  {extractApiErrorMessage(listQuery.error, 'Impossible de charger le catalogue')}
                </Text>
              ) : null}
            </View>
          </>
        }
        ListEmptyComponent={
          listQuery.isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ width: GRID_CARD_WIDTH, marginLeft: GRID_PADDING }} />
          ) : (
            <Text style={[typography.body, { color: colors.textMuted, paddingHorizontal: GRID_PADDING }]}>
              Aucun livre ne correspond à votre recherche.
            </Text>
          )
        }
        ListFooterComponent={
          listQuery.isFetchingNextPage ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
          ) : null
        }
        onRefresh={() => {
          listQuery.refetch();
          topRatedQuery.refetch();
          recentQuery.refetch();
          dashboardQuery.refetch();
        }}
        refreshing={listQuery.isRefetching && !listQuery.isFetchingNextPage}
      />

      <HomeTopBar
        greeting={greetingForHour(new Date().getHours())}
        onPressSearch={goToSearch}
        opacity={topBarOpacity}
        pointerEvents={isPastSticky ? 'none' : 'box-none'}
      />
      <StickyCategoryBar
        categories={categoriesQuery.data ?? []}
        categoryId={categoryId}
        onSelectCategory={setCategoryId}
        onPressSearch={goToSearch}
        opacity={stickyBarOpacity}
        pointerEvents={isPastSticky ? 'auto' : 'none'}
      />
      {continueReadingEntry ? <ContinueReadingBar entry={continueReadingEntry} visibility={continueBarVisibility} /> : null}
    </View>
  );
}
