import cron from 'node-cron';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { resumeEpubGenerationQueue } from './modules/epub/epub.worker';
import { sendCheckInReminders } from './modules/notifications/notifications.service';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Serveur démarré sur ${env.APP_URL} (env: ${env.NODE_ENV})`);
  void resumeEpubGenerationQueue().catch((error: unknown) => logger.error({ err: error }, 'Impossible de reprendre les générations EPUB'));
});

// 19h chaque jour, heure du serveur (pas de notion de fuseau par utilisateur
// pour l'instant, cf. todayDateOnlyUtc dans notifications.service.ts) : relance
// les séries de check-in encore "sauvables" avant la fin de journée.
cron.schedule('0 19 * * *', () => {
  sendCheckInReminders()
    .then(({ usersNotified }) => logger.info({ usersNotified }, 'Relances check-in envoyées'))
    .catch((error: unknown) => logger.error({ err: error }, "Échec de l'envoi des relances check-in"));
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
