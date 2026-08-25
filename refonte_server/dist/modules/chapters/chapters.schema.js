"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReadingProgressSchema = exports.bookReadingProgressParamSchema = exports.bookIdParamSchema = exports.chapterIdParamSchema = exports.updateChapterSchema = exports.createChapterSchema = void 0;
const zod_1 = require("zod");
const extensionSchema = zod_1.z.object({
    introduction: zod_1.z.string().optional(),
});
exports.createChapterSchema = zod_1.z.object({
    bookId: zod_1.z.number().int().positive(),
    partId: zod_1.z.number().int().positive().nullable().optional(),
    title: zod_1.z.string().min(1).max(255),
    content: zod_1.z.string().min(1),
    chapterNumber: zod_1.z.number().int().positive(),
    extension: extensionSchema.optional(),
});
exports.updateChapterSchema = exports.createChapterSchema.partial().omit({ bookId: true });
exports.chapterIdParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
exports.bookIdParamSchema = zod_1.z.object({
    bookId: zod_1.z.coerce.number().int().positive(),
});
// Monté sous /books/:id/reading-progress — id désigne ici le livre, pas un
// chapitre, d'où un schéma dédié plutôt que la réutilisation de chapterIdParamSchema.
exports.bookReadingProgressParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
exports.updateReadingProgressSchema = zod_1.z.object({
    chapterNumber: zod_1.z.number().int().positive(),
    // Décimal (pas int) : cf. schema.prisma sur ReadBook.progressPercent — la
    // reprise "exacte" en mobile dépend de cette précision.
    progressPercent: zod_1.z.number().min(0).max(100),
});
//# sourceMappingURL=chapters.schema.js.map