"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const prisma_1 = require("./lib/prisma");
const app = (0, app_1.createApp)();
const server = app.listen(env_1.env.PORT, () => {
    logger_1.logger.info(`🚀 Serveur démarré sur ${env_1.env.APP_URL} (env: ${env_1.env.NODE_ENV})`);
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