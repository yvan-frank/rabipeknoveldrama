<?php

declare(strict_types=1);

namespace App\Modules\Epub;

use App\Config\Env;

/**
 * Équivalent partiel de src/modules/epub/epub-storage.ts — driver "local"
 * uniquement. Le driver "s3" (EPUB_STORAGE_DRIVER=s3) n'est pas porté : il
 * dépend du SDK AWS, une dépendance Composer lourde qui va à l'encontre de
 * l'esprit "PHP natif, zéro dépendance" de ce scaffold. EPUB_STORAGE_DIR
 * (disque local, à monter sur un volume persistant en production) reste
 * pleinement supporté et est le driver par défaut des deux côtés.
 *
 * @todo Porter le driver S3 si le déploiement cible en a besoin — même
 *   interface (persist/open/exists/delete), implémentation via l'API REST
 *   S3 signée manuellement (SigV4) pour rester sans dépendance, ou via
 *   aws/aws-sdk-php si une dépendance Composer devient acceptable.
 */
final class EpubStorage
{
    private static function assertLocalDriver(): void
    {
        if (Env::get('EPUB_STORAGE_DRIVER', 'local') !== 'local') {
            throw new \RuntimeException(
                'EPUB_STORAGE_DRIVER=s3 non supporté par ce scaffold PHP — voir EpubStorage.php',
            );
        }
    }

    private static function root(): string
    {
        $dir = Env::get('EPUB_STORAGE_DIR', 'private/epub') ?? 'private/epub';
        if (str_starts_with($dir, '/') || preg_match('#^[A-Za-z]:[\\\\/]#', $dir) === 1) {
            return $dir;
        }
        return dirname(__DIR__, 3) . '/' . $dir;
    }

    private static function buildDir(): string
    {
        return sys_get_temp_dir() . '/rabipek-epub-build';
    }

    // Réserve un chemin de fichier temporaire local pour construire une
    // archive EPUB avant de la persister.
    public static function reserveBuildPath(): string
    {
        $dir = self::buildDir();
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        return $dir . '/' . self::uuidV4() . '.epub';
    }

    // Déplace le fichier EPUB construit localement vers le stockage durable configuré.
    public static function persist(string $buildFilePath, string $storageKey): void
    {
        self::assertLocalDriver();

        $destination = self::root() . '/' . $storageKey;
        $destinationDir = dirname($destination);
        if (!is_dir($destinationDir)) {
            mkdir($destinationDir, 0755, true);
        }
        if (!rename($buildFilePath, $destination)) {
            throw new \RuntimeException('Impossible de déplacer le fichier EPUB vers le stockage durable');
        }
    }

    /** @return array{path:string,contentLength:int}|null */
    public static function open(string $storageKey): ?array
    {
        self::assertLocalDriver();

        $target = self::root() . '/' . $storageKey;
        if (!is_file($target)) {
            return null;
        }
        return ['path' => $target, 'contentLength' => filesize($target)];
    }

    public static function exists(string $storageKey): bool
    {
        self::assertLocalDriver();
        return is_file(self::root() . '/' . $storageKey);
    }

    public static function delete(string $storageKey): void
    {
        self::assertLocalDriver();
        $target = self::root() . '/' . $storageKey;
        if (is_file($target)) {
            unlink($target);
        }
    }

    private static function uuidV4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
