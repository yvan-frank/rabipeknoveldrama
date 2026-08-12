"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kycBypassSchema = exports.kycVerificationSchema = exports.authorIdParamSchema = exports.kycSchema = exports.documentTypeEnum = void 0;
const zod_1 = require("zod");
exports.documentTypeEnum = zod_1.z.enum(['cni', 'passeport', 'autre']);
// Soumission KYC : toutes les données requises pour considérer l'identité de
// l'auteur comme vérifiée (cf. authors.service.ts, isKycComplete). Les réseaux
// sociaux restent optionnels (utiles mais non requis pour la vérification).
exports.kycSchema = zod_1.z.object({
    country: zod_1.z.string().min(1, 'Le pays est requis').max(50),
    address: zod_1.z.string().min(1, "L'adresse est requise").max(50),
    documentType: exports.documentTypeEnum,
    documentId: zod_1.z.string().min(1, "Le numéro du document est requis").max(50),
    documents: zod_1.z.string().min(1, "Le document scanné est requis"),
    fullName: zod_1.z.string().min(1, 'Le nom complet est requis').max(50),
    socialLinks: zod_1.z.record(zod_1.z.string(), zod_1.z.string().url()).optional(),
    privacyAccepted: zod_1.z.boolean().refine((v) => v === true, {
        message: 'Vous devez accepter la politique de confidentialité',
    }),
});
exports.authorIdParamSchema = zod_1.z.object({
    authorId: zod_1.z.coerce.number().int().positive(),
});
exports.kycVerificationSchema = zod_1.z.object({
    verified: zod_1.z.boolean(),
});
exports.kycBypassSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
});
//# sourceMappingURL=authors.schema.js.map