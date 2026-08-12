import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Choisissez une note').max(5),
  message: z.string().min(1, 'Votre avis ne peut pas être vide').max(2000),
});
export type ReviewFormValues = z.infer<typeof reviewSchema>;
