"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookPartIdParamSchema = exports.updateBookPartSchema = exports.createBookPartSchema = void 0;
const zod_1 = require("zod");
exports.createBookPartSchema = zod_1.z.object({
    bookId: zod_1.z.number().int().positive(),
    title: zod_1.z.string().trim().min(1, 'Le titre de la partie est requis').max(255),
    partNumber: zod_1.z.number().int().positive(),
    description: zod_1.z.string().trim().max(5000).optional(),
    price: zod_1.z.number().int().min(0),
    isFree: zod_1.z.boolean().default(false),
    freeChapterCount: zod_1.z.number().int().min(0).default(0),
});
exports.updateBookPartSchema = exports.createBookPartSchema.partial().omit({ bookId: true });
exports.bookPartIdParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
//# sourceMappingURL=book-parts.schema.js.map