import { z } from 'zod';

export const sendSupportMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const supportUserIdParamSchema = z.object({
  userId: z.coerce.number().int().positive(),
});
