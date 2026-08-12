import path from 'node:path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { corsOptions } from './config/cors';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { router } from './routes';

export function createApp() {
  const app = express();

  // `crossOriginResourcePolicy` sinon Helmet bloque le chargement des images
  // uploadées depuis l'origine du frontend (différente de celle de l'API).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok' });
  });

  app.use('/api', router);

  // Ordre volontaire : notFoundHandler puis errorHandler, tous deux APRÈS
  // le montage des routes.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
