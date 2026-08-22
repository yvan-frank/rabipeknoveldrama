import { z } from 'zod';

export const epubEditionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
