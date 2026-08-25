import { View } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '../theme/useTheme';

// Ligne de tâche fantôme : icône ronde + titre/description + pastille CTA —
// même gabarit que TaskRow dans bonus.tsx.
function TaskRowSkeleton({ isLast }: { isLast?: boolean }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'flex-start' },
        !isLast && { borderBottomWidth: 1, borderColor: colors.border, paddingBottom: spacing.md, marginBottom: spacing.md },
      ]}
    >
      <Skeleton width={28} height={28} borderRadius={radius.pill} />
      <View style={{ flex: 1, marginLeft: spacing.md, marginRight: spacing.sm }}>
        <Skeleton width="55%" height={15} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="85%" height={12} borderRadius={4} />
      </View>
      <Skeleton width={64} height={26} borderRadius={radius.pill} />
    </View>
  );
}

function TaskSectionCardSkeleton({ rows = 3 }: { rows?: number }) {
  const { colors, spacing, radius, shadow } = useTheme();
  return (
    <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md }]}>
      <Skeleton width={140} height={16} borderRadius={4} style={{ marginBottom: spacing.md }} />
      {Array.from({ length: rows }).map((_, index) => (
        <TaskRowSkeleton key={index} isLast={index === rows - 1} />
      ))}
    </View>
  );
}

// Reproduit la mise en page réelle de bonus.tsx (bannière, carte check-in,
// sections de tâches) pendant le tout premier chargement — évite le flash
// "0/—" avant la première réponse de GET /points/*.
export function BonusScreenSkeleton() {
  const { colors, spacing, radius, shadow } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.accentMuted,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl + spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <Skeleton width={90} height={16} borderRadius={4} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg }}>
        <View style={[shadow, { marginTop: -64, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }]}>
          <Skeleton width={160} height={16} borderRadius={4} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg }}>
            {Array.from({ length: 7 }).map((_, index) => (
              <View key={index} style={{ alignItems: 'center', width: 30 }}>
                <Skeleton width={24} height={24} borderRadius={12} />
              </View>
            ))}
          </View>
          <Skeleton height={4} borderRadius={2} style={{ marginTop: spacing.sm }} />
          <Skeleton height={48} borderRadius={radius.pill} style={{ marginTop: spacing.lg }} />
        </View>

        <TaskSectionCardSkeleton rows={3} />
        <TaskSectionCardSkeleton rows={2} />
      </View>
    </View>
  );
}
