import { z } from 'zod';

const extensionSchema = z.object({
  introduction: z.string().optional(),
});

export const createChapterSchema = z.object({
  bookId: z.number().int().positive(),
  partId: z.number().int().positive().nullable().optional(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  extension: extensionSchema.optional(),
});
export type CreateChapterInput = z.infer<typeof createChapterSchema>;

export const updateChapterSchema = createChapterSchema.partial().omit({ bookId: true });
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;

export const chapterIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const bookIdParamSchema = z.object({
  bookId: z.coerce.number().int().positive(),
});

// Monté sous /books/:id/reading-progress — id désigne ici le livre, pas un
// chapitre, d'où un schéma dédié plutôt que la réutilisation de chapterIdParamSchema.
export const bookReadingProgressParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateReadingProgressSchema = z.object({
  chapterNumber: z.number().int().positive(),
  // Décimal (pas int) : cf. schema.prisma sur ReadBook.progressPercent — la
  // reprise "exacte" en mobile dépend de cette précision.
  progressPercent: z.number().min(0).max(100),
});
export type UpdateReadingProgressInput = z.infer<typeof updateReadingProgressSchema>;
