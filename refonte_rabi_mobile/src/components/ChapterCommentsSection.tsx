import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { showAlert } from './AppAlert';
import { BottomSheet } from './BottomSheet';
import { ConfirmDialog } from './ConfirmDialog';
import { Skeleton } from './Skeleton';
import { useAuthStore } from '../auth/auth-store';
import { extractApiErrorMessage } from '../api/client';
import { deleteChapterComment, fetchChapterComments, submitChapterComment, type ChapterCommentItem } from '../api/comments';
import { useTheme } from '../theme/useTheme';

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
  return `il y a ${Math.floor(diffDays / 30)} mois`;
}

// Tout ce composant vit sur le fond transparent/sombre du BottomSheet
// "comments" (cf. chapter/[chapterId].tsx, variant="transparent") — texte et
// composeur toujours clairs, indépendants du thème clair/sombre courant,
// calqués sur la capture de référence, pas sur les couleurs de surface
// habituelles de l'app (qui supposeraient un fond clair).
const BUBBLE_BG = '#1C1C1E';
const BUBBLE_TEXT = '#FFFFFF';
const BUBBLE_MUTED = 'rgba(255,255,255,0.55)';
const PANEL_TEXT = '#FFFFFF';
const PANEL_MUTED = 'rgba(255,255,255,0.6)';
const PANEL_DANGER = '#FCA5A5';

function showLikeComingSoon() {
  showAlert('Bientôt disponible', 'Aimer un commentaire arrive prochainement.');
}

function CommentBubble({
  comment,
  replyCount,
  onReply,
  onOpenActions,
  onOpenDetail,
}: {
  comment: ChapterCommentItem;
  replyCount: number;
  onReply: () => void;
  onOpenActions: () => void;
  onOpenDetail?: () => void;
}) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: colors.loveMuted }]}>
        <Ionicons name="person" size={18} color={colors.love} />
      </View>
      <View style={{ flex: 1, marginLeft: 8, position: 'relative' }}>
        <View style={[styles.bubbleTail, { backgroundColor: BUBBLE_BG }]} />
        <Pressable onPress={onOpenDetail} disabled={!onOpenDetail} style={[styles.bubble, { backgroundColor: BUBBLE_BG }]}>
          <View style={styles.bubbleHeader}>
            <Text style={[typography.bodySemiBold, { color: BUBBLE_TEXT, flex: 1 }]} numberOfLines={1}>
              {comment.user.name ?? 'Lecteur'}
            </Text>
            <Pressable onPress={onOpenActions} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={16} color={BUBBLE_MUTED} />
            </Pressable>
          </View>
          <Text style={[typography.body, { color: BUBBLE_TEXT, marginTop: 2 }]}>{comment.content}</Text>
          <Text style={[typography.caption, { color: BUBBLE_MUTED, marginTop: 8 }]}>{formatRelativeDate(comment.createdAt)}</Text>
          <View style={styles.bubbleFooter}>
            <Pressable onPress={showLikeComingSoon} style={styles.footerAction} hitSlop={6}>
              <Ionicons name="heart-outline" size={15} color={BUBBLE_MUTED} />
              <Text style={[typography.caption, { color: BUBBLE_MUTED }]}>0</Text>
            </Pressable>
            <Pressable onPress={onReply} style={styles.footerAction} hitSlop={6}>
              <Ionicons name="chatbubble-outline" size={14} color={BUBBLE_MUTED} />
              <Text style={[typography.caption, { color: BUBBLE_MUTED }]}>{replyCount}</Text>
            </Pressable>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// Couleurs fixes (pas colors.border du thème) : ce panneau reste toujours
// sombre quel que soit le thème courant, cf. commentaire BUBBLE_BG ci-dessus.
const SKELETON_COLOR = 'rgba(255,255,255,0.14)';

function CommentBubbleSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={36} height={36} borderRadius={18} color={SKELETON_COLOR} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <View style={[styles.bubble, { backgroundColor: BUBBLE_BG }]}>
          <Skeleton width="40%" height={13} borderRadius={4} color={SKELETON_COLOR} style={{ marginBottom: 8 }} />
          <Skeleton height={13} borderRadius={4} color={SKELETON_COLOR} style={{ marginBottom: 6 }} />
          <Skeleton width="65%" height={13} borderRadius={4} color={SKELETON_COLOR} />
        </View>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.actionRow, { paddingHorizontal: spacing.lg }]}>
      <Ionicons name={icon} size={19} color={danger ? colors.danger : colors.ink} />
      <Text style={[typography.body, { color: danger ? colors.danger : colors.ink, marginLeft: spacing.md }]}>{label}</Text>
    </Pressable>
  );
}

interface ChapterCommentsSectionProps {
  chapterId: number;
}

// Miroir de ChapterEndScreen côté web : les commentaires vivent à la fin du
// chapitre, pas en marge de la lecture — on ne les affiche qu'une fois
// l'écran de fin de chapitre atteint (cf. le lecteur qui monte ce composant).
export function ChapterCommentsSection({ chapterId }: ChapterCommentsSectionProps) {
  const { colors, spacing, typography } = useTheme();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [content, setContent] = useState('');
  // La réponse à un commentaire précis (parentId) est déjà supportée par
  // l'API (cf. submitChapterComment) — l'icône "répondre" de chaque bulle
  // l'active, contrairement au cœur "j'aime" qui n'a aucun support backend.
  const [replyTarget, setReplyTarget] = useState<{ id: number; name: string } | null>(null);
  // Commentaire en attente de confirmation de suppression (cf. ConfirmDialog
  // ci-dessous, partagé par toutes les bulles plutôt qu'une instance chacune).
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  // Commentaire dont le menu "..." (Signaler/Supprimer/Masquer) est ouvert —
  // un seul sheet partagé, son contenu varie selon isOwn.
  const [actionsTarget, setActionsTarget] = useState<ChapterCommentItem | null>(null);
  // "Masquer" est purement local (pas de préférence serveur pour ça) : réduit
  // au minimum, ne survit pas à une fermeture du panneau — cohérent avec le
  // fait que Signaler n'a aucun support backend non plus pour l'instant.
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  // Vue détail plein écran (dans le panneau) d'un commentaire précis, ouverte
  // en tapant sa bulle — remplace la liste par le commentaire + ses réponses,
  // avec un en-tête "Revoir le détail" et retour, comme sur la capture de
  // référence. Pas d'étoiles de notation ici (contrairement à la capture) :
  // ça n'existe que pour les avis livre, pas pour les commentaires de
  // chapitre, ça aurait été une fonctionnalité factice.
  const [detailComment, setDetailComment] = useState<ChapterCommentItem | null>(null);

  const commentsQuery = useQuery({ queryKey: ['chapter-comments', chapterId], queryFn: () => fetchChapterComments(chapterId) });

  const submitMutation = useMutation({
    mutationFn: () => submitChapterComment(chapterId, content.trim(), replyTarget?.id),
    onSuccess: () => {
      setContent('');
      // En vue détail, on reste "en réponse" à ce même fil (pour enchaîner
      // plusieurs réponses sans retaper) — sinon on efface la cible.
      setReplyTarget(detailComment ? { id: detailComment.id, name: detailComment.user.name ?? 'Lecteur' } : null);
      queryClient.invalidateQueries({ queryKey: ['chapter-comments', chapterId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => deleteChapterComment(commentId),
    onSuccess: (_data, commentId) => {
      setPendingDeleteId(null);
      // Le commentaire affiché en vue détail vient de disparaître : retour à
      // la liste plutôt qu'une vue détail vide/orpheline.
      if (detailComment?.id === commentId) closeDetail();
      queryClient.invalidateQueries({ queryKey: ['chapter-comments', chapterId] });
    },
    onError: (error) => showAlert('Erreur', extractApiErrorMessage(error, 'Impossible de supprimer ce commentaire')),
  });

  // Liste plate côté serveur : les réponses (parentId non nul) sont indentées
  // sous leur parent plutôt que réordonnées en fil de discussion complet.
  // Les commentaires masqués (cf. hiddenIds) sont exclus avant tout le reste.
  const topLevel = (commentsQuery.data ?? []).filter((comment) => comment.parentId === null && !hiddenIds.has(comment.id));
  const repliesByParent = new Map<number, ChapterCommentItem[]>();
  for (const comment of commentsQuery.data ?? []) {
    if (comment.parentId === null || hiddenIds.has(comment.id)) continue;
    const list = repliesByParent.get(comment.parentId) ?? [];
    list.push(comment);
    repliesByParent.set(comment.parentId, list);
  }

  function startReply(comment: ChapterCommentItem) {
    setReplyTarget({ id: comment.id, name: comment.user.name ?? 'Lecteur' });
  }

  function hideComment(commentId: number) {
    setHiddenIds((current) => new Set(current).add(commentId));
  }

  function openDetail(comment: ChapterCommentItem) {
    setDetailComment(comment);
    setReplyTarget({ id: comment.id, name: comment.user.name ?? 'Lecteur' });
  }

  function closeDetail() {
    setDetailComment(null);
    setReplyTarget(null);
  }

  return (
    <View>
      {detailComment ? (
        <View style={styles.detailHeader}>
          <Pressable onPress={closeDetail} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={PANEL_TEXT} />
          </Pressable>
          <Text style={[typography.bodySemiBold, { color: PANEL_TEXT, flex: 1, textAlign: 'center', marginRight: 22 }]}>
            Revoir le détail
          </Text>
        </View>
      ) : (
        <Text style={[typography.heading, { color: PANEL_TEXT, marginBottom: spacing.md }]}>
          Commentaires {commentsQuery.data?.length ? `(${commentsQuery.data.length})` : ''}
        </Text>
      )}

      {detailComment ? (
        <View>
          <CommentBubble
            comment={detailComment}
            replyCount={(repliesByParent.get(detailComment.id) ?? []).length}
            onReply={() => openDetail(detailComment)}
            onOpenActions={() => setActionsTarget(detailComment)}
          />
          {(repliesByParent.get(detailComment.id) ?? []).map((reply) => (
            <View key={reply.id} style={{ marginLeft: 30 }}>
              <CommentBubble
                comment={reply}
                replyCount={0}
                onReply={() => openDetail(detailComment)}
                onOpenActions={() => setActionsTarget(reply)}
              />
            </View>
          ))}
        </View>
      ) : commentsQuery.isLoading ? (
        <>
          <CommentBubbleSkeleton />
          <CommentBubbleSkeleton />
          <CommentBubbleSkeleton />
        </>
      ) : topLevel.length === 0 ? (
        <Text style={[typography.body, { color: PANEL_MUTED, marginBottom: spacing.md }]}>
          Aucun commentaire pour ce chapitre — lancez la discussion.
        </Text>
      ) : (
        topLevel.map((comment) => {
          const replies = repliesByParent.get(comment.id) ?? [];
          return (
            <View key={comment.id}>
              <CommentBubble
                comment={comment}
                replyCount={replies.length}
                onReply={() => startReply(comment)}
                onOpenActions={() => setActionsTarget(comment)}
                onOpenDetail={() => openDetail(comment)}
              />
              {replies.map((reply) => (
                <View key={reply.id} style={{ marginLeft: 30 }}>
                  <CommentBubble
                    comment={reply}
                    replyCount={0}
                    onReply={() => startReply(comment)}
                    onOpenActions={() => setActionsTarget(reply)}
                    onOpenDetail={() => openDetail(reply)}
                  />
                </View>
              ))}
            </View>
          );
        })
      )}

      {/* Masqué en vue détail : qui on adresse est déjà évident (le
          commentaire affiché juste au-dessus), pas besoin de le répéter. */}
      {replyTarget && !detailComment ? (
        <View style={styles.replyBanner}>
          <Text style={[typography.caption, { color: PANEL_MUTED, flex: 1 }]} numberOfLines={1}>
            Réponse à {replyTarget.name}
          </Text>
          <Pressable onPress={() => setReplyTarget(null)} hitSlop={8}>
            <Ionicons name="close" size={16} color={PANEL_MUTED} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.composer}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={replyTarget ? `Répondre à ${replyTarget.name}…` : 'Qu’en pensez-vous ?'}
          placeholderTextColor={PANEL_MUTED}
          multiline
          style={[typography.body, { flex: 1, color: PANEL_TEXT, maxHeight: 90, paddingVertical: 6 }]}
        />
        <Pressable
          onPress={() => submitMutation.mutate()}
          disabled={content.trim().length === 0 || submitMutation.isPending}
          style={[styles.sendButton, { backgroundColor: colors.accent, opacity: content.trim().length === 0 ? 0.4 : 1 }]}
        >
          {submitMutation.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={15} color="#FFFFFF" />}
        </Pressable>
      </View>
      {submitMutation.isError ? (
        <Text style={[typography.caption, { color: PANEL_DANGER, marginTop: 6 }]}>
          {extractApiErrorMessage(submitMutation.error, "Impossible d'envoyer le commentaire")}
        </Text>
      ) : null}

      <BottomSheet visible={actionsTarget !== null} onClose={() => setActionsTarget(null)}>
        <View style={{ paddingBottom: spacing.sm }}>
          {actionsTarget && actionsTarget.user.id === currentUserId ? (
            <ActionRow
              icon="trash-outline"
              label="Supprimer"
              danger
              onPress={() => {
                const id = actionsTarget.id;
                setActionsTarget(null);
                setPendingDeleteId(id);
              }}
            />
          ) : (
            <ActionRow
              icon="flag-outline"
              label="Signaler"
              onPress={() => {
                setActionsTarget(null);
                showAlert('Bientôt disponible', 'Le signalement de commentaire arrive prochainement.');
              }}
            />
          )}
          <ActionRow
            icon="eye-off-outline"
            label="Masquer"
            onPress={() => {
              if (actionsTarget) hideComment(actionsTarget.id);
              setActionsTarget(null);
            }}
          />
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={pendingDeleteId !== null}
        title="Supprimer le commentaire ?"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDeleteId !== null) deleteMutation.mutate(pendingDeleteId);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bubble: { borderRadius: 16, padding: 12 },
  bubbleTail: { position: 'absolute', left: -4, top: 14, width: 12, height: 12, borderRadius: 2, transform: [{ rotate: '45deg' }] },
  bubbleHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 10 },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  replyBanner: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  sendButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
});
