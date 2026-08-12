import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const bookGrantIdParamSchema = z.object({
  grantId: z.coerce.number().int().positive(),
});

export const grantBookSchema = z.object({
  bookId: z.coerce.number().int().positive(),
  note: z.string().trim().max(500).optional(),
});
export type GrantBookInput = z.infer<typeof grantBookSchema>;
