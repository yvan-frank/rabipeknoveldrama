import { z } from 'zod';

// Miroir de src/modules/auth/auth.schema.ts côté refonte_server — la validation
// double (client pour l'UX, serveur pour la sécurité) est volontaire.
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// Règles affichées en direct dans <PasswordStrengthPanel> ET utilisées pour
// la validation zod — une seule source de vérité pour les deux.
export const PASSWORD_RULES = [
  { id: 'length', label: 'Au moins 8 caractères', test: (v: string) => v.length >= 8 },
  { id: 'uppercase', label: 'Une majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'lowercase', label: 'Une minuscule', test: (v: string) => /[a-z]/.test(v) },
  { id: 'number', label: 'Un chiffre', test: (v: string) => /\d/.test(v) },
  { id: 'special', label: 'Un caractère spécial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export function isStrongPassword(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export const MAX_ABOUT_WORDS = 100;

export function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit faire au moins 8 caractères')
  .refine(isStrongPassword, 'Le mot de passe ne respecte pas tous les critères ci-dessous');

// Un seul schéma pour tout le formulaire (compte simple + onboarding auteur en
// option) — les champs auteur ne sont requis que si `isAuthor` est coché,
// via des .refine ciblés par `path` : permet d'utiliser `trigger(fields)`
// étape par étape (même pattern que BookWizard) sans dupliquer le formulaire.
export const registerSchema = z
  .object({
    isAuthor: z.boolean(),
    name: z.string().max(150).optional().or(z.literal('')),
    email: z.string().email('Email invalide'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirmez votre mot de passe'),
    fullName: z.string().max(150).optional().or(z.literal('')),
    readerName: z.string().max(150).optional().or(z.literal('')),
    about: z.string().max(1000).optional().or(z.literal('')),
    genreIds: z.array(z.number()).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine((data) => data.isAuthor || (data.name ?? '').trim().length >= 2, {
    message: 'Nom trop court',
    path: ['name'],
  })
  .refine((data) => !data.isAuthor || (data.fullName ?? '').trim().length >= 2, {
    message: 'Nom complet trop court',
    path: ['fullName'],
  })
  .refine((data) => !data.isAuthor || (data.readerName ?? '').trim().length >= 2, {
    message: 'Nom pour les lecteurs trop court',
    path: ['readerName'],
  })
  .refine((data) => !data.isAuthor || (data.about ?? '').trim().length >= 10, {
    message: 'Décrivez-vous en quelques mots',
    path: ['about'],
  })
  .refine((data) => !data.isAuthor || countWords(data.about ?? '') <= MAX_ABOUT_WORDS, {
    message: `${MAX_ABOUT_WORDS} mots maximum`,
    path: ['about'],
  })
  .refine((data) => !data.isAuthor || (data.genreIds ?? []).length >= 1, {
    message: 'Choisissez au moins un genre',
    path: ['genreIds'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function toRegisterAuthorPayload(values: RegisterFormValues) {
  return {
    name: values.readerName ?? '',
    fullName: values.fullName ?? '',
    email: values.email,
    password: values.password,
    about: values.about ?? '',
    genreIds: values.genreIds ?? [],
  };
}
