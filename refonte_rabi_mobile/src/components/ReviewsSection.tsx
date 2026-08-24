import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text, TextInput, View } from 'react-native';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { extractApiErrorMessage } from '../api/client';
import { fetchBookReviews, submitBookReview, type Review } from '../api/comments';
import { useAuthStore } from '../auth/auth-store';
import { useTheme } from '../theme/useTheme';

function ReviewCard({ review }: { review: Review }) {
  const { colors, spacing, radius, typography, shadow } = useTheme();
  return (
    <View style={[shadow, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[typography.bodySemiBold, { color: colors.ink }]}>{review.user.name ?? 'Lecteur'}</Text>
        <StarRating rating={review.rating} size={14} />
      </View>
      <Text style={[typography.body, { color: colors.inkSecondary, marginTop: spacing.xs }]}>{review.message}</Text>
      {review.replies?.[0] ? (
        <View style={{ marginTop: spacing.sm, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.accent }}>
          <Text style={[typography.label, { color: colors.accent, marginBottom: 2 }]}>{"RÉPONSE DE L'AUTEUR"}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{review.replies[0].content}</Text>
        </View>
      ) : null}
    </View>
  );
}

interface ReviewsSectionProps {
  bookId: number;
}

export function ReviewsSection({ bookId }: ReviewsSectionProps) {
  const { colors, spacing, typography, shadow, radius } = useTheme();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
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

  return (
    <View>
      {otherReviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
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
            onPress={() => submitMutation.mutate()}
            loading={submitMutation.isPending}
            disabled={rating === 0 || message.trim().length === 0}
          />
        </View>
      </View>
    </View>
  );
}
