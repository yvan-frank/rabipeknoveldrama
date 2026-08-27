import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { showToast } from './Toast';
import { extractApiErrorMessage } from '../api/client';
import { fetchBookReviews, replyToBookReview, submitBookReview, type Review } from '../api/comments';
import { useAuthStore } from '../auth/auth-store';
import { useTheme } from '../theme/useTheme';

function ReviewCard({
  review,
  canReply,
  onReply,
  isReplyPending,
}: {
  review: Review;
  canReply: boolean;
  onReply: (commentId: number, content: string) => void;
  isReplyPending: boolean;
}) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  const existingReply = review.replies?.[0] ?? null;
  const [isReplying, setIsReplying] = useState(false);
  const [draft, setDraft] = useState(existingReply?.content ?? '');

  function handleSend() {
    if (draft.trim().length === 0) return;
    onReply(review.id, draft.trim());
    setIsReplying(false);
  }

  return (
    <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[typography.bodySemiBold, { color: colors.ink }]}>{review.user.name ?? 'Lecteur'}</Text>
        <StarRating rating={review.rating} size={14} />
      </View>
      <Text style={[typography.body, { color: colors.inkSecondary, marginTop: spacing.xs }]}>{review.message}</Text>

      {existingReply && !isReplying ? (
        <View style={{ marginTop: spacing.sm, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.accent }}>
          <Text style={[typography.label, { color: colors.accent, marginBottom: 2 }]}>{"RÉPONSE DE L'AUTEUR"}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{existingReply.content}</Text>
        </View>
      ) : null}

      {canReply ? (
        isReplying ? (
          <View style={{ marginTop: spacing.sm }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Votre réponse…"
              placeholderTextColor={colors.textMuted}
              multiline
              style={{
                minHeight: 60,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 10,
                color: colors.ink,
                textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Button label="Annuler" variant="secondary" onPress={() => setIsReplying(false)} disabled={isReplyPending} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Envoyer" onPress={handleSend} loading={isReplyPending} disabled={draft.trim().length === 0} />
              </View>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setIsReplying(true)} style={{ marginTop: spacing.sm }}>
            <Text style={[typography.captionSemiBold, { color: colors.accent }]}>{existingReply ? 'Modifier ma réponse' : 'Répondre'}</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

interface ReviewsSectionProps {
  bookId: number;
  // Absent (livre en cours de chargement) ou différent de l'auteur connecté
  // -> aucune option de réponse affichée. Comparé à authorId (pas userId) :
  // AuthUser.authorId, pas .id, identifie un compte auteur (cf. api/types.ts).
  bookAuthorId?: number;
}

export function ReviewsSection({ bookId, bookAuthorId }: ReviewsSectionProps) {
  const { colors, spacing, typography, shadow, radius } = useTheme();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const authorId = useAuthStore((state) => state.user?.authorId);
  const isGuest = useAuthStore((state) => state.status === 'guest');
  const isOwningAuthor = authorId !== undefined && authorId === bookAuthorId;
  const [draftRating, setDraftRating] = useState(0);
  const [draftMessage, setDraftMessage] = useState('');
  const [hasEditedDraft, setHasEditedDraft] = useState(false);

  const reviewsQuery = useQuery({ queryKey: ['reviews', bookId], queryFn: () => fetchBookReviews(bookId) });

  const myExistingReview = useMemo(
    () => reviewsQuery.data?.find((review) => review.user.id === userId),
    [reviewsQuery.data, userId],
  );

  const rating = hasEditedDraft ? draftRating : (myExistingReview?.rating ?? draftRating);
  const message = hasEditedDraft ? draftMessage : (myExistingReview?.message ?? draftMessage);

  const submitMutation = useMutation({
    mutationFn: () => submitBookReview(bookId, rating, message.trim()),
    onSuccess: () => {
      setHasEditedDraft(false);
      queryClient.invalidateQueries({ queryKey: ['reviews', bookId] });
      queryClient.invalidateQueries({ queryKey: ['book'] });
    },
  });

  const otherReviews = (reviewsQuery.data ?? []).filter((review) => review.user.id !== userId);

  const replyMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) => replyToBookReview(commentId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', bookId] }),
    onError: (err) => showToast(extractApiErrorMessage(err, "Impossible d'envoyer votre réponse")),
  });

  // Visiteur non connecté : /books/:id/reviews exige une session côté
  // serveur (401 sinon) — invité à se connecter via un toast plutôt que
  // laissé remplir le formulaire pour échouer à la soumission.
  function handleSubmit() {
    if (isGuest) {
      showToast('Connectez-vous pour laisser un avis', 'Se connecter', () => router.push('/(auth)/login'));
      return;
    }
    submitMutation.mutate();
  }

  return (
    <View>
      {otherReviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          canReply={isOwningAuthor}
          onReply={(commentId, content) => replyMutation.mutate({ commentId, content })}
          isReplyPending={replyMutation.isPending}
        />
      ))}
      {reviewsQuery.data?.length === 0 ? (
        <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.md }]}>
          Aucun avis pour le moment — soyez le premier à en laisser un.
        </Text>
      ) : null}

      <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm }]}>
        <Text style={[typography.bodySemiBold, { color: colors.ink, marginBottom: spacing.sm }]}>
          {myExistingReview ? 'Modifier mon avis' : 'Laisser un avis'}
        </Text>
        <StarRating
          rating={rating}
          size={26}
          onChange={(value) => {
            setHasEditedDraft(true);
            setDraftRating(value);
            if (!hasEditedDraft) setDraftMessage(myExistingReview?.message ?? '');
          }}
        />
        <TextInput
          value={message}
          onChangeText={(value) => {
            setHasEditedDraft(true);
            setDraftMessage(value);
          }}
          placeholder="Qu'avez-vous pensé de ce livre ?"
          placeholderTextColor={colors.textMuted}
          multiline
          style={{
            marginTop: spacing.sm,
            minHeight: 80,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
            color: colors.ink,
            textAlignVertical: 'top',
          }}
        />
        {submitMutation.isError ? (
          <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
            {extractApiErrorMessage(submitMutation.error, "Impossible d'envoyer votre avis")}
          </Text>
        ) : null}
        <View style={{ marginTop: spacing.sm }}>
          <Button
            label={myExistingReview ? 'Mettre à jour' : 'Publier'}
            onPress={handleSubmit}
            loading={submitMutation.isPending}
            disabled={!isGuest && (rating === 0 || message.trim().length === 0)}
          />
        </View>
      </View>
    </View>
  );
}
