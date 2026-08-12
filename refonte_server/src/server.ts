import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Serveur démarré sur ${env.APP_URL} (env: ${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} reçu, arrêt en cours...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Arrêt propre terminé.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
