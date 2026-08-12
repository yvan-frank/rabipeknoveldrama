"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChapterCommentSchema = exports.chapterIdParamSchema = exports.replyToReviewSchema = exports.upsertReviewSchema = exports.bookIdParamSchema = void 0;
const zod_1 = require("zod");
exports.bookIdParamSchema = zod_1.z.object({
    bookId: zod_1.z.coerce.number().int().positive(),
});
exports.upsertReviewSchema = zod_1.z.object({
    message: zod_1.z.string().min(1).max(2000),
    rating: zod_1.z.number().int().min(1).max(5),
});
exports.replyToReviewSchema = zod_1.z.object({ content: zod_1.z.string().min(1).max(2000) });
exports.chapterIdParamSchema = zod_1.z.object({
    chapterId: zod_1.z.coerce.number().int().positive(),
});
exports.createChapterCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(2000),
    // Réponse à un commentaire existant si renseigné (fil de discussion).
    parentId: zod_1.z.number().int().positive().optional(),
});
//# sourceMappingURL=comments.schema.js.map