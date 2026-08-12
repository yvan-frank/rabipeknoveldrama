import { z } from 'zod';

export const bookIdParamSchema = z.object({
  bookId: z.coerce.number().int().positive(),
});
