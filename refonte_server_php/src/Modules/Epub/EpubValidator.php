<?php

declare(strict_types=1);

namespace App\Modules\Epub;

use App\Config\Env;
use RuntimeException;
use ZipArchive;

/**
 * Équivalent de src/modules/epub/epub-validator.service.ts. Contrôles
 * structurels rapides, exécutés dans tous les environnements ; EPUBCheck
 * (JAR Java) complète cette validation quand EPUBCHECK_JAR_PATH est
 * configuré au déploiement, comme côté Node.
 */
final class EpubValidator
{
    public static function validate(string $filePath): void
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new RuntimeException('Archive EPUB illisible');
        }

        try {
            $names = [];
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $names[] = $zip->getNameIndex($i);
            }

            $first = $zip->statIndex(0);
            if ($first === false || $first['name'] !== 'mimetype' || $first['comp_method'] !== ZipArchive::CM_STORE) {
                throw new RuntimeException("EPUB invalide : l'entrée mimetype doit être la première et non compressée");
            }

            $mimetype = $zip->getFromName('mimetype');
            if ($mimetype !== 'application/epub+zip') {
                throw new RuntimeException('EPUB invalide : mimetype incorrect');
            }

            $nameSet = array_flip($names);
            if (!isset($nameSet['META-INF/container.xml'], $nameSet['OEBPS/content.opf'], $nameSet['OEBPS/nav.xhtml'])) {
                throw new RuntimeException('EPUB invalide : package, container ou navigation manquant');
            }

            $hasChapter = false;
            foreach ($names as $name) {
                if (str_starts_with($name, 'OEBPS/text/') && str_ends_with($name, '.xhtml')) {
                    $hasChapter = true;
                    break;
                }
            }
            if (!$hasChapter) {
                throw new RuntimeException('EPUB invalide : aucun chapitre XHTML');
            }

            foreach ($names as $name) {
                if (str_contains($name, '..') || str_starts_with($name, '/')) {
                    throw new RuntimeException("EPUB invalide : chemin d'archive dangereux");
                }
            }
        } finally {
            $zip->close();
        }

        self::runEpubCheck($filePath);
    }

    private static function runEpubCheck(string $filePath): void
    {
        $jarPath = Env::get('EPUBCHECK_JAR_PATH');
        if ($jarPath === null || $jarPath === '') {
            if (Env::bool('EPUBCHECK_REQUIRED')) {
                throw new RuntimeException('EPUBCHECK_JAR_PATH est requis pour valider les EPUB en production');
            }
            return;
        }

        $command = sprintf('java -jar %s %s 2>&1', escapeshellarg($jarPath), escapeshellarg($filePath));
        exec($command, $output, $exitCode);

        if ($exitCode !== 0) {
            $details = implode("\n", $output);
            throw new RuntimeException("EPUBCheck a rejeté l'archive : " . mb_substr($details, 0, 3000));
        }
    }
}
