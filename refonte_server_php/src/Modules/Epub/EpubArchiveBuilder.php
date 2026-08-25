<?php

declare(strict_types=1);

namespace App\Modules\Epub;

use RuntimeException;
use ZipArchive;

/**
 * Équivalent de buildEpubArchive (epub.service.ts, via archiver). ZipArchive
 * est intégrée à PHP (ext-zip) : pas besoin de dépendance Composer pour
 * produire l'archive.
 */
final class EpubArchiveBuilder
{
    /**
     * @param list<array{name:string,content:string,store?:bool}> $entries
     */
    public static function build(array $entries): string
    {
        $buildFilePath = EpubStorage::reserveBuildPath();

        $zip = new ZipArchive();
        if ($zip->open($buildFilePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException("Impossible de créer l'archive EPUB");
        }

        foreach ($entries as $entry) {
            $zip->addFromString($entry['name'], $entry['content']);
            // mimetype doit être la première entrée ET non compressée (norme EPUB).
            if (($entry['store'] ?? false) === true) {
                $zip->setCompressionName($entry['name'], ZipArchive::CM_STORE);
            }
        }

        $zip->close();

        return $buildFilePath;
    }
}
