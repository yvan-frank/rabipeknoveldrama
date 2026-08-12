"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewStatsQuerySchema = exports.statsBookIdParamSchema = void 0;
const zod_1 = require("zod");
exports.statsBookIdParamSchema = zod_1.z.object({ id: zod_1.z.coerce.number().int().positive() });
exports.viewStatsQuerySchema = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    groupBy: zod_1.z.enum(['day', 'country', 'platform']).default('day'),
});
//# sourceMappingURL=stats.schema.js.map