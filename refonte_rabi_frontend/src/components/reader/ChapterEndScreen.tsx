'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CornerDownRight } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import { useSession } from '@/hooks/useAuth';
import type { ApiResponse, ChapterComment } from '@/types/api';

interface ChapterEndScreenProps {
  chapterId: number;
  onGoToNextChapter: () => void;
  hasNextChapter: boolean;
}

interface CommentThread extends ChapterComment {
  replies: ChapterComment[];
}

// Un seul niveau de profondeur affiché (commentaire + réponses) même si le
// modèle backend autorise des réponses en cascade — largement suffisant pour
// un fil de discussion sous un chapitre, plus simple à lire.
function buildThreads(comments: ChapterComment[]): CommentThread[] {
  const topLevel = comments.filter((c) => c.parentId === null);
  return topLevel.map((comment) => ({
    ...comment,
    replies: comments.filter((c) => c.parentId === comment.id),
  }));
}

function CommentForm({
  onSubmit,
  isPending,
  isError,
  error,
  placeholder,
  autoFocus,
}: {
  onSubmit: (content: string) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={2}
        autoFocus={autoFocus}
        className="paper-sheet-surface rounded-md border px-3 py-2 text-sm text-[var(--paper-ink)] outline-none focus:border-brand-amber/50"
      />
      {isError && <p className="text-xs text-red-600">{extractApiErrorMessage(error, "Impossible d'envoyer")}</p>}
      <button
        type="submit"
        disabled={isPending || !value.trim()}
        className="self-start rounded-full bg-[var(--paper-ink)] px-4 py-1.5 text-xs font-medium text-[var(--paper-color)] disabled:opacity-40"
      >
        {isPending ? 'Envoi…' : 'Publier'}
      </button>
    </form>
  );
}

// Écran interstitiel affiché à la fin de la pagination d'un chapitre — pas
// de bascule silencieuse vers le chapitre suivant : place au fil de
// discussion (avis + réponses) avant de continuer. Rendu sur le même fond
// papier que la lecture (suit donc le thème clair/sombre, cf. .paper-sheet
// dans globals.css), mais sans les restrictions anti-copie (formulaire
// interactif, pas du contenu à protéger).
export function ChapterEndScreen({ chapterId, onGoToNextChapter, hasNextChapter }: ChapterEndScreenProps) {
  const { data: user } = useSession();
  const queryClient = useQueryClient();
  const [replyToId, setReplyToId] = useState<number | null>(null);

  const commentsQuery = useQuery({
    queryKey: ['chapter-comments', chapterId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ChapterComment[]>>(`/comments/chapter/${chapterId}`);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const postComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      const { data } = await apiClient.post<ApiResponse<ChapterComment>>(`/comments/chapter/${chapterId}`, {
        content,
        parentId,
      });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      setReplyToId(null);
      queryClient.invalidateQueries({ queryKey: ['chapter-comments', chapterId] });
    },
  });

  const threads = buildThreads(commentsQuery.data ?? []);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="font-serif relative flex h-full flex-col overflow-y-auto px-6 pt-[calc(env(safe-area-inset-top)_+_4rem)] pb-[calc(env(safe-area-inset-bottom)_+_4rem)] text-[var(--paper-ink)]"
    >
      <h2 className="text-xl font-semibold">Fin du chapitre</h2>
      <p className="mt-1 text-sm text-[var(--paper-ink)]/60">Qu&apos;en avez-vous pensé ?</p>

      <div className="mt-6 flex flex-col gap-5 font-sans">
        {user ? (
          <CommentForm
            placeholder="Laissez un avis sur ce chapitre…"
            onSubmit={(content) => postComment.mutate({ content })}
            isPending={postComment.isPending && replyToId === null}
            isError={postComment.isError && replyToId === null}
            error={postComment.error}
          />
        ) : (
          <p className="text-sm text-[var(--paper-ink)]/60">
            <Link href="/connexion" className="underline">
              Connectez-vous
            </Link>{' '}
            pour laisser un avis.
          </p>
        )}

        {commentsQuery.isLoading ? (
          <p className="text-sm text-[var(--paper-ink)]/50">Chargement des avis…</p>
        ) : threads.length === 0 ? (
          <p className="text-sm text-[var(--paper-ink)]/50">Aucun avis pour l&apos;instant — soyez le premier.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {threads.map((thread) => (
              <li key={thread.id} className="paper-sheet-surface rounded-lg border p-3">
                <p className="text-xs font-semibold text-[var(--paper-ink)]">
                  {thread.user.name ?? 'Lecteur anonyme'}
                </p>
                <p className="mt-1 text-sm text-[var(--paper-ink)]/80">{thread.content}</p>

                {user && (
                  <button
                    type="button"
                    onClick={() => setReplyToId(replyToId === thread.id ? null : thread.id)}
                    className="mt-2 text-xs font-medium text-brand-amber"
                  >
                    Répondre
                  </button>
                )}

                {replyToId === thread.id && (
                  <div className="mt-2">
                    <CommentForm
                      placeholder="Votre réponse…"
                      autoFocus
                      onSubmit={(content) => postComment.mutate({ content, parentId: thread.id })}
                      isPending={postComment.isPending}
                      isError={postComment.isError}
                      error={postComment.error}
                    />
                  </div>
                )}

                {thread.replies.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2 border-l border-[var(--paper-ink)]/10 pl-3">
                    {thread.replies.map((reply) => (
                      <li key={reply.id} className="flex gap-1.5">
                        <CornerDownRight size={14} className="mt-0.5 shrink-0 text-[var(--paper-ink)]/30" />
                        <div>
                          <p className="text-xs font-semibold text-[var(--paper-ink)]">
                            {reply.user.name ?? 'Lecteur anonyme'}
                          </p>
                          <p className="text-sm text-[var(--paper-ink)]/80">{reply.content}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onGoToNextChapter}
        disabled={!hasNextChapter}
        className="mt-8 flex items-center justify-center gap-2 self-center rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
      >
        {hasNextChapter ? 'Chapitre suivant' : 'Fin du livre'}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
