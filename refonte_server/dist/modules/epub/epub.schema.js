"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.epubEditionIdParamSchema = void 0;
const zod_1 = require("zod");
exports.epubEditionIdParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
//# sourceMappingURL=epub.schema.js.map