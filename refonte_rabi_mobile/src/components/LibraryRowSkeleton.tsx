import { View } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '../theme/useTheme';

// Même empreinte que LibraryRow dans library.tsx (cover 56×80, titre +
// sous-titre + barre de progression).
export function LibraryRowSkeleton() {
  const { colors, spacing, radius, shadow } = useTheme();
  return (
    <View
      style={[shadow, { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md }]}
    >
      <Skeleton width={56} height={80} borderRadius={radius.md} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Skeleton width="80%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={12} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton height={4} borderRadius={2} />
      </View>
    </View>
  );
}

export function LibraryRowSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <LibraryRowSkeleton key={index} />
      ))}
    </>
  );
}
