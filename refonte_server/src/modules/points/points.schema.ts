import { z } from 'zod';

export const listTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const articleIdParamSchema = z.object({
  articleId: z.enum(['article-1', 'article-2', 'article-3']),
});

export const addReadingTimeSchema = z.object({
  seconds: z.number().int().positive().max(120),
});
