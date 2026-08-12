import type { CorsOptions } from 'cors';
import { env } from './env';

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Requêtes sans origin (curl, apps mobiles, healthchecks) autorisées.
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin non autorisée par CORS : ${origin}`));
  },
  credentials: true,
};
