"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookIdParamSchema = exports.chapterIdParamSchema = exports.updateChapterSchema = exports.createChapterSchema = void 0;
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
//# sourceMappingURL=chapters.schema.js.map