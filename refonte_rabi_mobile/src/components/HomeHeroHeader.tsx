import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { priceLabel } from './BookListItem';
import { resolveAssetUrl } from '../lib/resolve-asset-url';
import { palette } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import type { TopRatedBookCard } from '../api/books';

// Toujours affiché sur l'image du héro (scrim sombre), quel que soit le
// thème courant : cf. PosterGridCard/ContinueReadingBar pour le même choix.
const OVERLAY_ACCENT = palette.light.accentMuted;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.52);
// Hauteur de l'espace transparent laissé au-dessus du héro dans la liste
// (cf. index.tsx) : le reste (HERO_HEIGHT - ce nombre) est l'overlap visible
// au repos entre les coins arrondis de la feuille de contenu et l'image.
export const HERO_REVEAL_HEIGHT = HERO_HEIGHT - 56;
const AUTOPLAY_INTERVAL_MS = 5000;

interface HomeHeroHeaderProps {
  books: TopRatedBookCard[];
  scrollY: Animated.Value;
  onPressBook: (slug: string) => void;
}

// Héro à hauteur FIXE, positionné derrière la liste (cf. index.tsx, qui la
// recouvre via un vrai scroll natif — pas de hauteur animée ici, seulement
// des transform/opacity, les deux seules propriétés que le driver natif sait
// animer sans à-coups). C'est ce qui élimine le tremblement précédent.
export function HomeHeroHeader({ books, scrollY, onPressBook }: HomeHeroHeaderProps) {
  const { spacing, typography } = useTheme();
  const [carouselX] = useState(() => new Animated.Value(0));
  const listRef = useRef<Animated.FlatList<TopRatedBookCard>>(null);
  // indexRef ne sert qu'au calcul de défilement dans l'effet/handler
  // ci-dessous (jamais lu pendant le rendu) ; activeIndex (state) est ce que
  // le JSX affiche, pour que le titre en surimpression se mette à jour.
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isDragging || books.length < 2) return;
    const interval = setInterval(() => {
      const next = (indexRef.current + 1) % books.length;
      indexRef.current = next;
      setActiveIndex(next);
      listRef.current?.scrollToOffset({ offset: next * SCREEN_WIDTH, animated: true });
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isDragging, books.length]);

  const activeBook = books[Math.min(activeIndex, books.length - 1)];

  // Parallax natif : l'image glisse plus lentement que le contenu qui la
  // recouvre (transform uniquement -> 60fps garantis, aucun aller-retour JS).
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-150, 0, HERO_REVEAL_HEIGHT],
    outputRange: [-40, 0, HERO_REVEAL_HEIGHT * 0.4],
    extrapolate: 'clamp',
  });
  const imageScale = scrollY.interpolate({ inputRange: [-150, 0], outputRange: [1.35, 1], extrapolateRight: 'clamp' });
  const textOpacity = scrollY.interpolate({ inputRange: [0, HERO_REVEAL_HEIGHT * 0.6], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: imageTranslateY }, { scale: imageScale }] }]}>
        {books.length > 0 ? (
          <Animated.FlatList
            ref={listRef}
            data={books}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(book) => String(book.id)}
            onScrollBeginDrag={() => setIsDragging(true)}
            onScrollEndDrag={() => setIsDragging(false)}
            onMomentumScrollEnd={(event) => {
              const next = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              indexRef.current = next;
              setActiveIndex(next);
            }}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: carouselX } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Pressable onPress={() => onPressBook(item.slug)} style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}>
                {item.cover ? (
                  <Animated.Image source={{ uri: resolveAssetUrl(item.cover) }} style={styles.image} resizeMode="cover" />
                ) : null}
              </Pressable>
            )}
          />
        ) : null}
      </Animated.View>

      <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={styles.topFade} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} locations={[0.35, 1]} style={styles.bottomFade} pointerEvents="none" />

      {activeBook ? (
        <Animated.View style={[styles.bottomContent, { left: spacing.lg, right: spacing.lg, bottom: spacing.xl, opacity: textOpacity }]}>
          <Text style={[typography.label, { color: OVERLAY_ACCENT, marginBottom: 6 }]}>À LA UNE</Text>
          <Text style={[typography.hero, { color: '#FFFFFF' }]} numberOfLines={2}>
            {activeBook.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
            <Text style={[typography.captionSemiBold, { color: '#FFFFFF' }]}>★ {activeBook.averageRating.toFixed(1)}</Text>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.75)', marginLeft: 8 }]}>{priceLabel(activeBook)}</Text>
          </View>

          <View style={styles.dots}>
            {books.map((book, index) => {
              const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
              // transform (scaleX), pas width : la largeur n'est pas animable par
              // le driver natif (cf. le crash précédent).
              const scaleX = carouselX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
              const dotOpacity = carouselX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
              return <Animated.View key={book.id} style={[styles.dot, { opacity: dotOpacity, transform: [{ scaleX }] }]} />;
            })}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // zIndex explicite : sans ça, l'ordre d'empilement entre ce héro (absolu)
  // et la liste qui le recouvre au scroll n'est pas garanti sur toutes les
  // plateformes (Android en particulier, avec l'elevation des cartes).
  container: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT, overflow: 'hidden', zIndex: 0, elevation: 0 },
  image: { width: '100%', height: '100%' },
  topFade: { position: 'absolute', left: 0, right: 0, top: 0, height: 120 },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  bottomContent: { position: 'absolute' },
  dots: { flexDirection: 'row', gap: 6, marginTop: 14 },
  dot: { width: 20, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
});
