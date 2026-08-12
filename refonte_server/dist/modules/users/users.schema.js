"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grantBookSchema = exports.bookGrantIdParamSchema = exports.userIdParamSchema = exports.listUsersQuerySchema = void 0;
const zod_1 = require("zod");
exports.listUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.userIdParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
exports.bookGrantIdParamSchema = zod_1.z.object({
    grantId: zod_1.z.coerce.number().int().positive(),
});
exports.grantBookSchema = zod_1.z.object({
    bookId: zod_1.z.coerce.number().int().positive(),
    note: zod_1.z.string().trim().max(500).optional(),
});
//# sourceMappingURL=users.schema.js.map