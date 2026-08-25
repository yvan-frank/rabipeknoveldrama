"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportUserIdParamSchema = exports.sendSupportMessageSchema = void 0;
const zod_1 = require("zod");
exports.sendSupportMessageSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1).max(2000),
});
exports.supportUserIdParamSchema = zod_1.z.object({
    userId: zod_1.z.coerce.number().int().positive(),
});
//# sourceMappingURL=support.schema.js.map