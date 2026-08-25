import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { showAlert } from '../../src/components/AppAlert';
import { resolveAssetUrl } from '../../src/lib/resolve-asset-url';
import { useRecentlyViewedStore, type RecentlyViewedEntry } from '../../src/lib/recently-viewed-store';
import { useTheme } from '../../src/theme/useTheme';

// "25 août 2026 à 14:32" — locale FR explicite (pas de dépendance à la
// locale système, qui n'est pas garantie sur Android/iOS pour ce projet).
function formatViewedAt(timestampMs: number): string {
  const date = new Date(timestampMs);
  const datePart = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  const timePart = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
  return `Vu le ${datePart} à ${timePart}`;
}

function HistoryRow({ entry, onPress }: { entry: RecentlyViewedEntry; onPress: () => void }) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  return (
    <Pressable
      onPress={onPress}
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
      <View style={{ flex: 1, marginLeft: spacing.md, justifyContent: 'center' }}>
        <Text style={[typography.heading, { color: colors.ink }]} numberOfLines={2}>
          {entry.book.title}
        </Text>
        {entry.book.author?.name ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 3 }]} numberOfLines={1}>
            {entry.book.author.name}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 5 }}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={[typography.label, { color: colors.textMuted }]} numberOfLines={1}>
            {formatViewedAt(entry.viewedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Historique local (cf. src/lib/recently-viewed-store.ts) : identique pour un
// visiteur et un utilisateur connecté, aucune requête réseau ici.
export default function HistoryScreen() {
  const { colors, spacing, typography } = useTheme();
  const entries = useRecentlyViewedStore((state) => state.entries);
  const clear = useRecentlyViewedStore((state) => state.clear);

  function handleClear() {
    showAlert("Effacer l'historique ?", 'Les livres consultés récemment seront retirés de cette liste.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: clear },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.book.slug}
        renderItem={({ item }) => <HistoryRow entry={item} onPress={() => router.push(`/book/${item.book.slug}`)} />}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        ListHeaderComponent={
          entries.length ? (
            <Pressable onPress={handleClear} style={styles.clearRow} hitSlop={6}>
              <Text style={[typography.captionSemiBold, { color: colors.accent }]}>Effacer l&apos;historique</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
              Aucun livre consulté pour l&apos;instant. Les livres que vous ouvrez apparaîtront ici.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  cover: { width: 56, height: 80, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  clearRow: { alignSelf: 'flex-end', marginBottom: 12 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 64 },
});
