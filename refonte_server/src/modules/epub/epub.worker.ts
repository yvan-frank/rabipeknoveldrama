import { logger } from '../../lib/logger';
import { generateEpubEdition, resumeQueuedEpubGenerations } from './epub.service';

const activeEditionIds = new Set<number>();

export function queueEpubGeneration(editionId: number) {
  if (activeEditionIds.has(editionId)) return;
  activeEditionIds.add(editionId);
  setImmediate(() => {
    void generateEpubEdition(editionId)
      .catch((error: unknown) => logger.error({ err: error, editionId }, 'Échec du worker EPUB'))
      .finally(() => activeEditionIds.delete(editionId));
  });
}

export async function resumeEpubGenerationQueue() {
  const editionIds = await resumeQueuedEpubGenerations();
  editionIds.forEach(queueEpubGeneration);
}
