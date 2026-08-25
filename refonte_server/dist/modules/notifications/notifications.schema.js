"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushTokenBodySchema = void 0;
const zod_1 = require("zod");
exports.pushTokenBodySchema = zod_1.z.object({
    // Format "ExponentPushToken[...]" — pas de validation stricte du format ici,
    // Expo rejettera lui-même un jeton mal formé au moment de l'envoi.
    token: zod_1.z.string().trim().min(10).max(255),
});
//# sourceMappingURL=notifications.schema.js.map