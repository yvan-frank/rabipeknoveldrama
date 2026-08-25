import { z } from 'zod';

export const bookIdParamSchema = z.object({
  bookId: z.coerce.number().int().positive(),
});

export const upsertReviewSchema = z.object({
  message: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5),
});
export type UpsertReviewInput = z.infer<typeof upsertReviewSchema>;
export const replyToReviewSchema = z.object({ content: z.string().min(1).max(2000) });

export const chapterIdParamSchema = z.object({
  chapterId: z.coerce.number().int().positive(),
});

export const createChapterCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  // Réponse à un commentaire existant si renseigné (fil de discussion).
  parentId: z.number().int().positive().optional(),
});
export type CreateChapterCommentInput = z.infer<typeof createChapterCommentSchema>;

export const chapterCommentIdParamSchema = z.object({
  commentId: z.coerce.number().int().positive(),
});
