import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email(),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Miroir du wizard onboarding auteur côté frontend (RegisterForm) — la
// validation "au plus 100 mots" est dupliquée côté client pour l'UX, ici
// pour la sécurité (le client ne fait jamais foi).
const ABOUT_MAX_WORDS = 100;

export const registerAuthorSchema = z.object({
  // Nom affiché publiquement aux lecteurs (ex. "Par {name}" sur la fiche livre).
  name: z.string().min(2, 'Nom trop court').max(150),
  // Nom légal complet — stocké sur AuthorExtension.fullName, réutilisé tel
  // quel par le formulaire KYC (cf. authors.service.ts).
  fullName: z.string().min(2, 'Nom complet trop court').max(150),
  email: z.string().email(),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
  about: z
    .string()
    .min(10, 'Décrivez-vous en quelques mots')
    .max(1000)
    .refine((v) => v.trim().split(/\s+/).filter(Boolean).length <= ABOUT_MAX_WORDS, {
      message: `La description doit faire au maximum ${ABOUT_MAX_WORDS} mots`,
    }),
  genreIds: z.array(z.number().int().positive()).min(1, 'Choisissez au moins un genre'),
});
export type RegisterAuthorInput = z.infer<typeof registerAuthorSchema>;
