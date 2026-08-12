import { z } from 'zod';

export const statsBookIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const viewStatsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'country', 'platform']).default('day'),
});
export type ViewStatsQuery = z.infer<typeof viewStatsQuerySchema>;
