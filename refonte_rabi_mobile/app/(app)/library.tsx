import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { LibraryRowSkeletonList } from '../../src/components/LibraryRowSkeleton';
import { useAuthStore } from '../../src/auth/auth-store';
import { extractApiErrorMessage } from '../../src/api/client';
import { fetchDashboard, overallProgress, type LibraryEntry } from '../../src/api/library';
import { resolveAssetUrl } from '../../src/lib/resolve-asset-url';
import { useTheme } from '../../src/theme/useTheme';

function LibraryRow({ entry }: { entry: LibraryEntry }) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const percent = overallProgress(entry);

  return (
    <Pressable
      onPress={() => router.push(`/book/${entry.book.slug}`)}
      style={({ pressed }) => [
        styles.row,
        shadow,
        { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: colors.background, borderRadius: radius.md }]}>
        {entry.book.cover ? (
          <Image source={{ uri: resolveAssetUrl(entry.book.cover) }} style={styles.coverImage} resizeMode="cover" />
        ) : null}
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.heading, { color: colors.ink }]} numberOfLines={1}>
          {entry.book.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
          {entry.chapterRead != null
            ? `Chapitre ${entry.chapterRead}/${entry.totalChapters}`
            : `${entry.totalChapters} chapitres`}
          {entry.purchased ? ' · Acheté' : ''}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.border, marginTop: spacing.xs }]}>
          <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: colors.accent }]} />
        </View>
      </View>
    </Pressable>
  );
}

// Écran "poussé" depuis Compte (plus un onglet du bas, cf. _layout.tsx des
// tabs) : le titre "Bibliothèque" vient du header natif de la Stack (cf.
// app/(app)/_layout.tsx), pas d'un gros titre maison comme quand c'était un
// onglet — même convention que search.tsx/settings.tsx.
export default function LibraryScreen() {
  const { colors, spacing, typography } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  // La bibliothèque est un espace personnel (livres achetés/progression) —
  // n'a de sens que connecté. Un visiteur peut atteindre cet écran (aucune
  // garde globale, cf. app/(app)/_layout.tsx) : on l'invite à se connecter
  // plutôt que de tenter un appel qui échouerait en 401.
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard, enabled: isAuthenticated });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {!isAuthenticated ? (
        <View style={[styles.guestState, { paddingHorizontal: spacing.lg }]}>
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg }]}>
            Connectez-vous pour retrouver vos livres achetés et votre progression de lecture.
          </Text>
          <Button label="S'identifier" onPress={() => router.push('/(auth)/login')} />
        </View>
      ) : (
        <FlatList
          data={dashboardQuery.data?.library ?? []}
          keyExtractor={(entry) => String(entry.id)}
          renderItem={({ item }) => <LibraryRow entry={item} />}
          onRefresh={() => dashboardQuery.refetch()}
          refreshing={dashboardQuery.isRefetching}
          contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
          ListEmptyComponent={
            dashboardQuery.isLoading ? (
              <LibraryRowSkeletonList />
            ) : dashboardQuery.isError ? (
              <Text style={[typography.body, { color: colors.danger }]}>
                {extractApiErrorMessage(dashboardQuery.error, 'Impossible de charger votre bibliothèque')}
              </Text>
            ) : (
              <Text style={[typography.body, { color: colors.textMuted }]}>
                {"Vous n'avez pas encore commencé de lecture. Découvrez le catalogue depuis l'accueil."}
              </Text>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  guestState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  cover: { width: 56, height: 80, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});
