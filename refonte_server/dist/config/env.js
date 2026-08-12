"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    APP_URL: zod_1.z.string().url().default('http://localhost:4000'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL est requis'),
    JWT_SECRET: zod_1.z.string().min(16, 'JWT_SECRET doit faire au moins 16 caractères'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    COOKIE_NAME: zod_1.z.string().default('rabipek_token'),
    // Clé AES-256 encodée en base64. Optionnelle ici pour laisser démarrer une
    // instance avant migration, mais obligatoire dès qu'un chapitre est lu ou
    // enregistré (contrôle dans chapter-content-encryption.ts).
    CONTENT_ENCRYPTION_KEY: zod_1.z.string().optional(),
    CORS_ORIGINS: zod_1.z
        .string()
        .default('')
        .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
    REDIS_URL: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASSWORD: zod_1.z.string().optional(),
    MAIL_SENDER_NAME: zod_1.z.string().optional(),
    MAIL_SENDER_ADDRESS: zod_1.z.string().optional(),
    PAYPAL_CLIENT_ID: zod_1.z.string().optional(),
    PAYPAL_CLIENT_SECRET: zod_1.z.string().optional(),
    PAYPAL_MODE: zod_1.z.enum(['sandbox', 'live']).default('sandbox'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Variables d\'environnement invalides :', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
exports.isProduction = exports.env.NODE_ENV === 'production';
//# sourceMappingURL=env.js.map