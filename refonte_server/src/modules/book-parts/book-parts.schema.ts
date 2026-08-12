import { z } from 'zod';

export const createBookPartSchema = z.object({
  bookId: z.number().int().positive(),
  title: z.string().trim().min(1, 'Le titre de la partie est requis').max(255),
  partNumber: z.number().int().positive(),
  description: z.string().trim().max(5000).optional(),
  price: z.number().int().min(0),
  isFree: z.boolean().default(false),
  freeChapterCount: z.number().int().min(0).default(0),
});
export type CreateBookPartInput = z.infer<typeof createBookPartSchema>;

export const updateBookPartSchema = createBookPartSchema.partial().omit({ bookId: true });
export type UpdateBookPartInput = z.infer<typeof updateBookPartSchema>;

export const bookPartIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
