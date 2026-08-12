"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartPartIdParamSchema = exports.addPartToCartSchema = void 0;
const zod_1 = require("zod");
exports.addPartToCartSchema = zod_1.z.object({
    partId: zod_1.z.number().int().positive(),
});
exports.cartPartIdParamSchema = zod_1.z.object({
    partId: zod_1.z.coerce.number().int().positive(),
});
//# sourceMappingURL=cart.schema.js.map