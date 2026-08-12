"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookSlugParamSchema = exports.deleteBookSchema = exports.moderateBookSchema = exports.grantBookToEmailSchema = exports.bookIdParamSchema = exports.topRatedBooksQuerySchema = exports.listBooksQuerySchema = exports.updateBookSchema = exports.createBookSchema = void 0;
const zod_1 = require("zod");
const extensionSchema = zod_1.z.object({
    introduction: zod_1.z.string().optional(),
    topics: zod_1.z.string().optional(),
    conclusion: zod_1.z.string().optional(),
    language: zod_1.z.string().max(50).optional(),
});
exports.createBookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    datePub: zod_1.z.coerce.date(),
    cover: zod_1.z.string().min(1),
    filePath: zod_1.z.string().max(255).optional(),
    price: zod_1.z.number().int().min(0),
    pageNumber: zod_1.z.number().int().min(1),
    // Facultatif : un livre peut être géré entièrement via la lecture intégrée
    // (chapitres), sans fichier téléchargeable externe.
    bookLink: zod_1.z.string().min(1).optional(),
    resume: zod_1.z.string().min(1),
    isFree: zod_1.z.boolean().default(true),
    readBeforePay: zod_1.z.boolean().default(false),
    freeChapterCount: zod_1.z.number().int().min(0).default(3),
    isPromotion: zod_1.z.boolean().default(false),
    promotionPrice: zod_1.z.number().int().min(0).default(0),
    // Public visé : true = réservé aux 18 ans et plus.
    isAdultOnly: zod_1.z.boolean().default(false),
    categoryId: zod_1.z.number().int().positive(),
    authorId: zod_1.z.number().int().positive(),
    extension: extensionSchema.optional(),
});
exports.updateBookSchema = exports.createBookSchema.partial().omit({ authorId: true });
exports.listBooksQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    categoryId: zod_1.z.coerce.number().int().positive().optional(),
    authorId: zod_1.z.coerce.number().int().positive().optional(),
    search: zod_1.z.string().min(1).max(255).optional(),
    isFree: zod_1.z.coerce.boolean().optional(),
});
exports.topRatedBooksQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(20).default(6),
});
exports.bookIdParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
exports.grantBookToEmailSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email(),
    note: zod_1.z.string().trim().max(500).optional(),
});
exports.moderateBookSchema = zod_1.z.object({
    action: zod_1.z.enum(['publish', 'unpublish', 'block', 'suspend', 'delete']),
    confirmationPhrase: zod_1.z.string().trim().refine((value) => value === 'CONFIRMER', { message: 'Confirmation requise' }),
});
// Protège la suppression contre les clics accidentels, y compris si la route
// est appelée sans passer par l'interface. Ce n'est pas un secret : la phrase
// matérialise le consentement explicite de l'auteur connecté.
exports.deleteBookSchema = zod_1.z.object({
    confirmationPhrase: zod_1.z.string().trim().refine((value) => value === 'SUPPRIMER', {
        message: 'Saisissez exactement « SUPPRIMER » pour confirmer la suppression',
    }),
});
exports.bookSlugParamSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1),
});
//# sourceMappingURL=books.schema.js.map