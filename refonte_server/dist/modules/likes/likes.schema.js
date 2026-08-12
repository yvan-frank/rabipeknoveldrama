"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookIdParamSchema = void 0;
const zod_1 = require("zod");
exports.bookIdParamSchema = zod_1.z.object({
    bookId: zod_1.z.coerce.number().int().positive(),
});
//# sourceMappingURL=likes.schema.js.map