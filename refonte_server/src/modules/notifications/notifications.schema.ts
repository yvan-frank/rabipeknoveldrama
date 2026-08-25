import { z } from 'zod';

export const pushTokenBodySchema = z.object({
  // Format "ExponentPushToken[...]" — pas de validation stricte du format ici,
  // Expo rejettera lui-même un jeton mal formé au moment de l'envoi.
  token: z.string().trim().min(10).max(255),
});
