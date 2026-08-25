"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReadingTimeSchema = exports.articleIdParamSchema = exports.listTransactionsQuerySchema = void 0;
const zod_1 = require("zod");
exports.listTransactionsQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
exports.articleIdParamSchema = zod_1.z.object({
    articleId: zod_1.z.enum(['article-1', 'article-2', 'article-3']),
});
exports.addReadingTimeSchema = zod_1.z.object({
    seconds: zod_1.z.number().int().positive().max(120),
});
//# sourceMappingURL=points.schema.js.map