"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueEpubGeneration = queueEpubGeneration;
exports.resumeEpubGenerationQueue = resumeEpubGenerationQueue;
const logger_1 = require("../../lib/logger");
const epub_service_1 = require("./epub.service");
const activeEditionIds = new Set();
function queueEpubGeneration(editionId) {
    if (activeEditionIds.has(editionId))
        return;
    activeEditionIds.add(editionId);
    setImmediate(() => {
        void (0, epub_service_1.generateEpubEdition)(editionId)
            .catch((error) => logger_1.logger.error({ err: error, editionId }, 'Échec du worker EPUB'))
            .finally(() => activeEditionIds.delete(editionId));
    });
}
async function resumeEpubGenerationQueue() {
    const editionIds = await (0, epub_service_1.resumeQueuedEpubGenerations)();
    editionIds.forEach(queueEpubGeneration);
}
//# sourceMappingURL=epub.worker.js.map