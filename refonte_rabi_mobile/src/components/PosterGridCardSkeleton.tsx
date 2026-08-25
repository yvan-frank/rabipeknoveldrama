import { View } from 'react-native';
import { Skeleton } from './Skeleton';
import { GRID_CARD_WIDTH } from './PosterGridCard';
import { useTheme } from '../theme/useTheme';

// Même empreinte que PosterGridCard (width GRID_CARD_WIDTH, aspectRatio
// 0.68, radius.lg) : évite tout saut de mise en page à l'arrivée des vraies
// cartes.
export function PosterGridCardSkeleton() {
  const { radius } = useTheme();
  return (
    <View style={{ width: GRID_CARD_WIDTH }}>
      <Skeleton width={GRID_CARD_WIDTH} height={GRID_CARD_WIDTH / 0.68} borderRadius={radius.lg} />
    </View>
  );
}

// Grille 2 colonnes pour les emplacements ListEmptyComponent (rendu une
// seule fois, pas répété par FlatList) — reproduit columnWrapperStyle des
// écrans réels (gap 14). paddingHorizontal par défaut à 20 (padding des
// FlatList index.tsx/search.tsx) ; passer 0 quand le conteneur parent a déjà
// son propre padding horizontal (ex. librairie.tsx, ScrollView paddingHorizontal spacing.lg).
export function PosterGridSkeletonGrid({ count = 6, paddingHorizontal = 20 }: { count?: number; paddingHorizontal?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal }}>
      {Array.from({ length: count }).map((_, index) => (
        <PosterGridCardSkeleton key={index} />
      ))}
    </View>
  );
}
