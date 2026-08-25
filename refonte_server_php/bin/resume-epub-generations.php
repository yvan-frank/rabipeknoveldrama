<?php

declare(strict_types=1);

/**
 * Équivalent CLI de resumeEpubGenerationQueue() dans server.ts (appelé au
 * démarrage du process Node). Ce scaffold PHP n'a pas de process persistant
 * ni de worker de fond : à exécuter manuellement après un redémarrage/déploiement
 * (ou via une tâche cron/supervisor courte), pour repasser en QUEUED puis
 * traiter immédiatement les éditions restées bloquées en PROCESSING/QUEUED
 * (ex. après un arrêt brutal du serveur pendant une génération).
 *
 * Usage : php bin/resume-epub-generations.php
 */

use App\Config\Env;
use App\Modules\Epub\EpubService;

require dirname(__DIR__) . '/vendor/autoload.php';

Env::boot(dirname(__DIR__));

$editionIds = EpubService::resumeQueuedGenerations();

foreach ($editionIds as $editionId) {
    fwrite(STDOUT, "Génération de l'édition EPUB #{$editionId}...\n");
    EpubService::generateEpubEdition($editionId);
}

fwrite(STDOUT, count($editionIds) . " édition(s) traitée(s).\n");
