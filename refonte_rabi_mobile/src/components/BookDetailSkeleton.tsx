import { View } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '../theme/useTheme';

// Reproduit la mise en page réelle de book/[slug].tsx (hero cover+infos,
// boutons d'action, CTA, résumé, section chapitres) pour que l'arrivée des
// vraies données ne provoque aucun saut de mise en page.
export function BookDetailSkeleton() {
  const { colors, spacing, radius, shadow } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row' }}>
        <Skeleton width={100} height={140} borderRadius={14} />
        <View style={{ flex: 1, marginLeft: spacing.md, justifyContent: 'center' }}>
          <Skeleton height={22} borderRadius={5} style={{ marginBottom: 10 }} />
          <Skeleton width="60%" height={15} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={13} borderRadius={4} style={{ marginBottom: 10 }} />
          <Skeleton width={70} height={20} borderRadius={5} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
        <Skeleton width={90} height={38} borderRadius={10} />
        <Skeleton width={110} height={38} borderRadius={10} />
      </View>

      <Skeleton height={48} borderRadius={radius.pill} style={{ marginTop: spacing.lg }} />

      <Skeleton width={90} height={20} borderRadius={5} style={{ marginTop: spacing.xl, marginBottom: spacing.sm }} />
      <Skeleton height={15} borderRadius={4} style={{ marginBottom: 6 }} />
      <Skeleton height={15} borderRadius={4} style={{ marginBottom: 6 }} />
      <Skeleton width="70%" height={15} borderRadius={4} />

      <Skeleton width={130} height={20} borderRadius={5} style={{ marginTop: spacing.xl, marginBottom: spacing.sm }} />
      <View style={[shadow, { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.md }]}>
        <Skeleton height={16} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width="80%" height={13} borderRadius={4} />
      </View>
    </View>
  );
}
