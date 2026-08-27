import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { BookDetailSkeleton } from '../../../src/components/BookDetailSkeleton';
import { priceLabel } from '../../../src/components/BookListItem';
import { extractApiErrorMessage } from '../../../src/api/client';
import { fetchBookBySlug, type BookDetail } from '../../../src/api/books';
import { fetchReadingProgress } from '../../../src/api/chapters';
import { toggleBookLike } from '../../../src/api/likes';
import { flattenChapters, type ChapterEntry } from '../../../src/lib/chapter-access';
import { useRecentlyViewedStore } from '../../../src/lib/recently-viewed-store';
import { resolveAssetUrl } from '../../../src/lib/resolve-asset-url';
import { useTheme } from '../../../src/theme/useTheme';
import { EpubDownloadSection } from '../../../src/components/EpubDownloadSection';
import { ReviewsSection } from '../../../src/components/ReviewsSection';

function NotFoundState({ message }: { message: string }) {
  const { colors, spacing, typography, fontFamily } = useTheme();
  return (
    <View style={[styles.notFound, { backgroundColor: colors.background }]}>
      <View style={[styles.notFoundIconWrap, { backgroundColor: colors.accentMuted }]}>
        <Ionicons name="compass-outline" size={36} color={colors.accent} />
      </View>
      <Text style={[typography.title, { fontFamily: fontFamily.displayItalic, color: colors.ink, textAlign: 'center', marginTop: spacing.xl }]}>
        {message}
      </Text>
      <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
        Ce livre n&apos;existe pas ou n&apos;est plus disponible.
      </Text>
      <View style={{ marginTop: spacing.xl }}>
        <Button label="Retour" variant="secondary" onPress={() => router.back()} />
      </View>
    </View>
  );
}

function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={[styles.ageGate, { backgroundColor: colors.background }]}>
      <Text style={{ fontSize: 40, marginBottom: spacing.md }}>🔞</Text>
      <Text style={[typography.heading, { color: colors.ink, textAlign: 'center', marginBottom: spacing.sm }]}>
        Contenu réservé aux adultes
      </Text>
      <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl }]}>
        Ce livre contient des éléments destinés à un public averti. Confirmez que vous avez 18 ans ou plus pour continuer.
      </Text>
      <Button label="J'ai 18 ans ou plus" onPress={onConfirm} />
    </View>
  );
}

function ChapterRow({ entry, slug, isLast }: { entry: ChapterEntry; slug: string; isLast: boolean }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/book/${slug}/chapter/${entry.chapter.id}`)}
      style={[
        styles.chapterRow,
        { borderColor: colors.border, paddingVertical: spacing.md, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth },
      ]}
    >
      <Text style={[typography.body, { color: colors.ink, flex: 1 }]} numberOfLines={1}>
        {entry.chapter.chapterNumber}. {entry.chapter.title}
      </Text>
      <Ionicons
        name={entry.locked ? 'lock-closed' : 'lock-open-outline'}
        size={16}
        color={entry.locked ? colors.textMuted : colors.success}
      />
    </Pressable>
  );
}

export default function BookDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors, spacing, typography, shadow } = useTheme();
  const queryClient = useQueryClient();
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const { data: book, isLoading, isError, error } = useQuery({
    queryKey: ['book', slug],
    queryFn: () => fetchBookBySlug(slug),
  });

  // Alimente l'écran "Vu" (cf. app/(app)/history.tsx) — à chaque fiche livre
  // effectivement chargée, pas seulement à l'ouverture d'un chapitre.
  const recordView = useRecentlyViewedStore((state) => state.recordView);
  useEffect(() => {
    if (book) recordView(book);
  }, [book, recordView]);

  const progressQuery = useQuery({
    queryKey: ['reading-progress', book?.id],
    queryFn: () => fetchReadingProgress(book!.id),
    enabled: !!book,
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleBookLike(book!.id),
    onSuccess: (result) => {
      queryClient.setQueryData<BookDetail | undefined>(['book', slug], (current) =>
        current ? { ...current, isLikedByUser: result.liked, likeCount: result.likeCount } : current,
      );
    },
  });

  const chapterEntries = useMemo(() => (book ? flattenChapters(book) : []), [book]);

  const resumeEntry = useMemo(() => {
    if (!chapterEntries.length) return null;
    const targetChapterNumber = progressQuery.data?.chapterRead;
    if (targetChapterNumber) {
      const match = chapterEntries.find((entry) => entry.chapter.chapterNumber === targetChapterNumber);
      if (match) return match;
    }
    return chapterEntries[0]!;
  }, [chapterEntries, progressQuery.data]);

  async function handleShare() {
    if (!book) return;
    await Share.share({ message: `${book.title}${book.author?.name ? ` — ${book.author.name}` : ''} sur Rabipek` });
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <BookDetailSkeleton />
      </>
    );
  }

  if (isError || !book) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <NotFoundState message={extractApiErrorMessage(error, 'Livre introuvable')} />
      </>
    );
  }

  if (book.isAdultOnly && !ageConfirmed) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <AgeGate onConfirm={() => setAgeConfirmed(true)} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: book.title }} />
      {/* Sans ceci, le clavier recouvrait le champ de saisie de l'avis (loin
          dans le scroll) — même correctif que login.tsx/register.tsx et
          BottomSheet.tsx (panneau Commentaires) : 'height' sur Android (pas
          undefined), sinon KeyboardAvoidingView ne fait rien sur cette
          plateforme. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={[styles.cover, shadow, { backgroundColor: colors.surface, borderRadius: 14 }]}>
            {book.cover ? <Image source={{ uri: resolveAssetUrl(book.cover) }} style={styles.coverImage} resizeMode="cover" /> : null}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md, justifyContent: 'center' }}>
            <Text style={[typography.title, { color: colors.ink }]}>{book.title}</Text>
            {book.author?.name ? (
              <Text style={[typography.body, { color: colors.textMuted, marginTop: 3 }]}>{book.author.name}</Text>
            ) : null}
            {book.category ? (
              <Text style={[typography.captionSemiBold, { color: colors.accent, marginTop: spacing.xs }]}>{book.category.name}</Text>
            ) : null}
            {book.reviewCount > 0 ? (
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
                ★ {book.averageRating.toFixed(1)} ({book.reviewCount} avis)
              </Text>
            ) : null}
            <Text style={[typography.heading, { color: colors.accent, marginTop: spacing.sm }]}>{priceLabel(book)}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <Pressable
            onPress={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            style={[styles.actionButton, shadow, { backgroundColor: colors.surface }]}
          >
            <Ionicons name={book.isLikedByUser ? 'heart' : 'heart-outline'} size={18} color={book.isLikedByUser ? colors.love : colors.ink} />
            <Text style={[typography.captionSemiBold, { color: colors.ink, marginLeft: 6 }]}>{book.likeCount}</Text>
          </Pressable>
          <Pressable onPress={handleShare} style={[styles.actionButton, shadow, { backgroundColor: colors.surface }]}>
            <Ionicons name="share-social-outline" size={18} color={colors.ink} />
            <Text style={[typography.captionSemiBold, { color: colors.ink, marginLeft: 6 }]}>Partager</Text>
          </Pressable>
        </View>

        {resumeEntry ? (
          <View style={{ marginTop: spacing.lg }}>
            <Button
              label={progressQuery.data ? `Reprendre au chapitre ${progressQuery.data.chapterRead}` : 'Commencer la lecture'}
              onPress={() => router.push(`/book/${slug}/chapter/${resumeEntry.chapter.id}`)}
            />
          </View>
        ) : null}

        <Text style={[typography.heading, { color: colors.ink, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Résumé</Text>
        <Text style={[typography.body, { color: colors.inkSecondary }]}>{book.resume}</Text>

        <EpubDownloadSection bookId={book.id} bookTitle={book.title} />

        <Text style={[typography.heading, { color: colors.ink, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          Avis {book.reviewCount > 0 ? `(${book.reviewCount})` : ''}
        </Text>
        <ReviewsSection bookId={book.id} bookAuthorId={book.author?.id} />

        <Text style={[typography.heading, { color: colors.ink, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          Chapitres ({chapterEntries.length})
        </Text>
        <View style={[shadow, { backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: spacing.md }]}>
          {chapterEntries.map((entry, index) => (
            <ChapterRow key={entry.chapter.id} entry={entry} slug={slug} isLast={index === chapterEntries.length - 1} />
          ))}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  cover: { width: 100, height: 140, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  actionButton: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  ageGate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  notFoundIconWrap: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
});
