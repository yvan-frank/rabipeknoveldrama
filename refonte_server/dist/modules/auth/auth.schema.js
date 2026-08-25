"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthorSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(150),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(20, 'Refresh token invalide'),
});
// Miroir du wizard onboarding auteur côté frontend (RegisterForm) — la
// validation "au plus 100 mots" est dupliquée côté client pour l'UX, ici
// pour la sécurité (le client ne fait jamais foi).
const ABOUT_MAX_WORDS = 100;
exports.registerAuthorSchema = zod_1.z.object({
    // Nom affiché publiquement aux lecteurs (ex. "Par {name}" sur la fiche livre).
    name: zod_1.z.string().min(2, 'Nom trop court').max(150),
    // Nom légal complet — stocké sur AuthorExtension.fullName, réutilisé tel
    // quel par le formulaire KYC (cf. authors.service.ts).
    fullName: zod_1.z.string().min(2, 'Nom complet trop court').max(150),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
    about: zod_1.z
        .string()
        .min(10, 'Décrivez-vous en quelques mots')
        .max(1000)
        .refine((v) => v.trim().split(/\s+/).filter(Boolean).length <= ABOUT_MAX_WORDS, {
        message: `La description doit faire au maximum ${ABOUT_MAX_WORDS} mots`,
    }),
    genreIds: zod_1.z.array(zod_1.z.number().int().positive()).min(1, 'Choisissez au moins un genre'),
});
//# sourceMappingURL=auth.schema.js.map