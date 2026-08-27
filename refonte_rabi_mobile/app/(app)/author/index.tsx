import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/Button';
import { Skeleton } from '../../../src/components/Skeleton';
import { extractApiErrorMessage } from '../../../src/api/client';
import { fetchMyBooks, fetchMyKyc, type AuthorBookSummary } from '../../../src/api/authors';
import { useAuthStore } from '../../../src/auth/auth-store';
import { resolveAssetUrl } from '../../../src/lib/resolve-asset-url';
import { useTheme } from '../../../src/theme/useTheme';

function priceLabel(book: AuthorBookSummary): string {
  if (book.isFree) return 'Gratuit';
  return `${(book.isPromotion ? book.promotionPrice : book.price).toLocaleString('fr-FR')} FCFA`;
}

function BookRow({ book }: { book: AuthorBookSummary }) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/author/book/${book.id}`)}
      style={[shadow, styles.bookRow, { backgroundColor: colors.surface, borderRadius: radius.md }]}
    >
      <View style={[styles.cover, { backgroundColor: colors.background }]}>
        {book.cover ? <Image source={{ uri: resolveAssetUrl(book.cover) }} style={styles.coverImage} resizeMode="cover" /> : null}
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.bodySemiBold, { color: colors.ink }]} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 3 }]}>
          {book._count.chapters} chapitre{book._count.chapters > 1 ? 's' : ''} · {book.viewStats?.viewCount ?? 0} vues
        </Text>
        <Text style={[typography.captionSemiBold, { color: colors.accent, marginTop: 4 }]}>{priceLabel(book)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function AuthorHomeScreen() {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [books, setBooks] = useState<AuthorBookSummary[] | null>(null);
  const [isKycVerified, setIsKycVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [myBooks, kyc] = await Promise.all([fetchMyBooks(), fetchMyKyc()]);
      setBooks(myBooks);
      setIsKycVerified(kyc.isVerified);
      setError(null);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Impossible de charger l'espace auteur"));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // Garde-fou : cet écran n'est accessible que via le menu compte, réservé
  // aux comptes role==='author', mais un lien profond direct doit rester sûr.
  if (user?.role !== 'author') {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background, flex: 1 }]}>
        <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl }]}>
          Cet espace est réservé aux comptes auteur.
        </Text>
      </SafeAreaView>
    );
  }

  const totalChapters = (books ?? []).reduce((sum, book) => sum + book._count.chapters, 0);
  const totalViews = (books ?? []).reduce((sum, book) => sum + (book.viewStats?.viewCount ?? 0), 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
    >
      {isKycVerified === false ? (
        <Pressable
          onPress={() => router.push('/author/kyc')}
          style={[styles.kycBanner, { backgroundColor: colors.accentMuted, borderRadius: radius.md, marginBottom: spacing.lg }]}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.accent} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[typography.bodySemiBold, { color: colors.ink }]}>Vérification d&apos;identité requise</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
              Complétez votre KYC pour publier un livre ou un chapitre.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <View style={[shadow, styles.statCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
          <Text style={[typography.heading, { color: colors.ink }]}>{books?.length ?? 0}</Text>
          <Text style={[typography.label, { color: colors.textMuted }]}>Livres</Text>
        </View>
        <View style={[shadow, styles.statCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
          <Text style={[typography.heading, { color: colors.ink }]}>{totalChapters}</Text>
          <Text style={[typography.label, { color: colors.textMuted }]}>Chapitres</Text>
        </View>
        <View style={[shadow, styles.statCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
          <Text style={[typography.heading, { color: colors.ink }]}>{totalViews}</Text>
          <Text style={[typography.label, { color: colors.textMuted }]}>Vues</Text>
        </View>
      </View>

      <Button label="+ Nouveau livre" onPress={() => router.push('/author/new-book')} />

      <Text style={[typography.heading, { color: colors.ink, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Mes livres</Text>

      {error ? (
        <Text style={[typography.body, { color: colors.danger }]}>{error}</Text>
      ) : books === null ? (
        <View style={{ gap: spacing.sm }}>
          <Skeleton height={72} borderRadius={14} />
          <Skeleton height={72} borderRadius={14} />
        </View>
      ) : books.length === 0 ? (
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Vous n&apos;avez encore publié aucun livre — commencez par le bouton ci-dessus.
        </Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {books.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  kycBanner: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  bookRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  cover: { width: 48, height: 68, borderRadius: 8, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
});
