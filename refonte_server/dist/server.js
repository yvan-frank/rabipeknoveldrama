"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const prisma_1 = require("./lib/prisma");
const epub_worker_1 = require("./modules/epub/epub.worker");
const notifications_service_1 = require("./modules/notifications/notifications.service");
const app = (0, app_1.createApp)();
const server = app.listen(env_1.env.PORT, () => {
    logger_1.logger.info(`🚀 Serveur démarré sur ${env_1.env.APP_URL} (env: ${env_1.env.NODE_ENV})`);
    void (0, epub_worker_1.resumeEpubGenerationQueue)().catch((error) => logger_1.logger.error({ err: error }, 'Impossible de reprendre les générations EPUB'));
});
// 19h chaque jour, heure du serveur (pas de notion de fuseau par utilisateur
// pour l'instant, cf. todayDateOnlyUtc dans notifications.service.ts) : relance
// les séries de check-in encore "sauvables" avant la fin de journée.
node_cron_1.default.schedule('0 19 * * *', () => {
    (0, notifications_service_1.sendCheckInReminders)()
        .then(({ usersNotified }) => logger_1.logger.info({ usersNotified }, 'Relances check-in envoyées'))
        .catch((error) => logger_1.logger.error({ err: error }, "Échec de l'envoi des relances check-in"));
});
async function shutdown(signal) {
    logger_1.logger.info(`${signal} reçu, arrêt en cours...`);
    server.close(async () => {
        await prisma_1.prisma.$disconnect();
        logger_1.logger.info('Arrêt propre terminé.');
        process.exit(0);
    });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
//# sourceMappingURL=server.js.map