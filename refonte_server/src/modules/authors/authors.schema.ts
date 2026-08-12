import { z } from 'zod';

export const documentTypeEnum = z.enum(['cni', 'passeport', 'autre']);
export type DocumentType = z.infer<typeof documentTypeEnum>;

// Soumission KYC : toutes les données requises pour considérer l'identité de
// l'auteur comme vérifiée (cf. authors.service.ts, isKycComplete). Les réseaux
// sociaux restent optionnels (utiles mais non requis pour la vérification).
export const kycSchema = z.object({
  country: z.string().min(1, 'Le pays est requis').max(50),
  address: z.string().min(1, "L'adresse est requise").max(50),
  documentType: documentTypeEnum,
  documentId: z.string().min(1, "Le numéro du document est requis").max(50),
  documents: z.string().min(1, "Le document scanné est requis"),
  fullName: z.string().min(1, 'Le nom complet est requis').max(50),
  socialLinks: z.record(z.string(), z.string().url()).optional(),
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: 'Vous devez accepter la politique de confidentialité',
  }),
});
export type KycInput = z.infer<typeof kycSchema>;

export const authorIdParamSchema = z.object({
  authorId: z.coerce.number().int().positive(),
});

export const kycVerificationSchema = z.object({
  verified: z.boolean(),
});
export type KycVerificationInput = z.infer<typeof kycVerificationSchema>;

export const kycBypassSchema = z.object({
  enabled: z.boolean(),
});
export type KycBypassInput = z.infer<typeof kycBypassSchema>;
