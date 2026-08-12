import { z } from 'zod';

export const addPartToCartSchema = z.object({
  partId: z.number().int().positive(),
});

export const cartPartIdParamSchema = z.object({
  partId: z.coerce.number().int().positive(),
});
