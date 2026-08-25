import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url().default('http://localhost:4000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requis'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET doit faire au moins 16 caractères'),
  // Durée du JWT posé dans le cookie httpOnly web — comportement inchangé.
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Durée du JWT d'accès renvoyé en JSON pour les clients qui ne peuvent pas
  // lire un cookie httpOnly (app mobile). Volontairement courte : la session
  // longue durée est portée par le refresh token (JWT_REFRESH_TOKEN_TTL_DAYS),
  // révocable côté serveur, contrairement à ce JWT.
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  COOKIE_NAME: z.string().default('rabipek_token'),
  // Clé AES-256 encodée en base64. Optionnelle ici pour laisser démarrer une
  // instance avant migration, mais obligatoire dès qu'un chapitre est lu ou
  // enregistré (contrôle dans chapter-content-encryption.ts).
  CONTENT_ENCRYPTION_KEY: z.string().optional(),
  // Chemin du JAR EPUBCheck dans l'image de déploiement. La validation
  // structurelle interne reste active sans lui ; en production, activez
  // EPUBCHECK_REQUIRED pour rendre ce contrôle externe obligatoire.
  EPUBCHECK_JAR_PATH: z.string().min(1).optional(),
  EPUBCHECK_REQUIRED: z.coerce.boolean().default(false),
  // Domaines externes explicitement autorisés pour les couvertures et images
  // incorporées dans les EPUB. Évite qu'un contenu auteur serve à joindre des
  // services internes via le worker de génération (SSRF).
  EPUB_EXTERNAL_IMAGE_HOSTS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((host) => host.trim().toLowerCase()).filter(Boolean)),
  // Emplacement durable des fichiers EPUB générés. "local" écrit sur disque
  // (à monter sur un volume persistant en production) ; "s3" envoie vers un
  // stockage objet compatible S3 (AWS S3, MinIO, Cloudflare R2, DO Spaces),
  // seule option qui survit à un redéploiement/scaling sans volume partagé.
  EPUB_STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  // Utilisé uniquement par le driver "local". Relatif à process.cwd() si non absolu.
  EPUB_STORAGE_DIR: z.string().min(1).default('private/epub'),
  EPUB_S3_BUCKET: z.string().min(1).optional(),
  EPUB_S3_REGION: z.string().min(1).default('auto'),
  // Requis pour les fournisseurs compatibles S3 non-AWS (MinIO, R2, Spaces).
  // Laisser vide pour AWS S3.
  EPUB_S3_ENDPOINT: z.string().url().optional(),
  EPUB_S3_ACCESS_KEY_ID: z.string().optional(),
  EPUB_S3_SECRET_ACCESS_KEY: z.string().optional(),
  // À activer pour MinIO/certains fournisseurs S3-compatible.
  EPUB_S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
  EPUB_S3_PREFIX: z.string().default('epub'),

  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),

  REDIS_URL: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_SENDER_NAME: z.string().optional(),
  MAIL_SENDER_ADDRESS: z.string().optional(),

  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
}).superRefine((values, ctx) => {
  if (values.EPUB_STORAGE_DRIVER === 's3' && !values.EPUB_S3_BUCKET) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['EPUB_S3_BUCKET'], message: 'EPUB_S3_BUCKET est requis quand EPUB_STORAGE_DRIVER=s3' });
  }
});

// Convention "_PRO" : n'importe quelle variable FOO peut avoir un pendant
// FOO_PRO dans le même .env (ex. DATABASE_URL_PRO, JWT_SECRET_PRO). En
// production, sa valeur remplace celle de FOO — permet de garder les deux
// jeux de valeurs (dev/local et prod) dans un seul fichier au lieu d'un
// .env.production séparé à maintenir en double. Ignoré en dev/test : FOO
// garde alors sa propre valeur, jamais celle de FOO_PRO.
function applyProductionOverrides(rawEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (rawEnv.NODE_ENV !== 'production') return rawEnv;

  const resolved = { ...rawEnv };
  for (const key of Object.keys(rawEnv)) {
    if (!key.endsWith('_PRO')) continue;
    const baseKey = key.slice(0, -'_PRO'.length);
    const value = rawEnv[key];
    if (value !== undefined && value !== '') resolved[baseKey] = value;
  }
  return resolved;
}

const parsed = envSchema.safeParse(applyProductionOverrides(process.env));

if (!parsed.success) {
  console.error('❌ Variables d\'environnement invalides :', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
