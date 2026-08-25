import { View } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '../theme/useTheme';

// Même empreinte que PopularBookCard dans librairie.tsx (cover 64×92,
// bloc titre 2 lignes + étiquette catégorie).
export function PopularBookCardSkeleton() {
  const { radius, spacing } = useTheme();
  return (
    <View style={{ width: '48%', flexDirection: 'row', marginBottom: 20 }}>
      <Skeleton width={64} height={92} borderRadius={radius.sm} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Skeleton height={13} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="70%" height={13} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width={50} height={18} borderRadius={6} />
      </View>
    </View>
  );
}

export function PopularBookCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {Array.from({ length: count }).map((_, index) => (
        <PopularBookCardSkeleton key={index} />
      ))}
    </View>
  );
}
