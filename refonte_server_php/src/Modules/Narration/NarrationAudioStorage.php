<?php

declare(strict_types=1);

namespace App\Modules\Narration;

use App\Config\Env;
use RuntimeException;

/**
 * Rapatrie l'audio généré par le service TTS externe dans notre propre
 * public/uploads (même emplacement que les couvertures/documents, cf.
 * UploadMiddleware) plutôt que de ne stocker que son URL distante : le
 * chapitre reste lisible même si le service TTS est ensuite arrêté,
 * redéployé ailleurs, ou vide son propre cache.
 */
final class NarrationAudioStorage
{
    private const MAX_BYTES = 50 * 1024 * 1024;
    private const EXTENSION_BY_TYPE = [
        'audio/mpeg' => 'mp3',
        'audio/mp3' => 'mp3',
        'audio/wav' => 'wav',
        'audio/x-wav' => 'wav',
        'audio/ogg' => 'ogg',
    ];
    private const SUBDIR = 'narrations';

    // Télécharge l'audio depuis le service TTS et renvoie l'URL locale
    // (servie par cette même API) à stocker à la place de l'URL distante.
    public static function persist(string $sourceUrl, int $chapterId): string
    {
        $ch = curl_init($sourceUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
        ]);
        $content = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($content === false || $status !== 200) {
            throw new RuntimeException("Audio de narration inaccessible ({$status})" . ($error !== '' ? " : {$error}" : ''));
        }
        if ($content === '' || strlen($content) > self::MAX_BYTES) {
            throw new RuntimeException('Audio de narration vide ou trop volumineux');
        }

        $mediaType = strtolower(trim(explode(';', (string) $contentType)[0] ?? ''));
        $extension = self::EXTENSION_BY_TYPE[$mediaType] ?? self::extensionFromUrl($sourceUrl) ?? 'mp3';

        $targetDir = self::baseDir();
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $filename = "chapter-{$chapterId}-" . bin2hex(random_bytes(6)) . '.' . $extension;
        if (file_put_contents($targetDir . '/' . $filename, $content) === false) {
            throw new RuntimeException("Impossible d'enregistrer l'audio de narration");
        }

        return Env::appUrl() . '/uploads/' . self::SUBDIR . '/' . $filename;
    }

    // Best-effort : régénérer une narration ne doit jamais échouer à cause
    // d'un fichier précédent qu'on n'arrive pas à supprimer (permissions,
    // déjà absent...) — seulement laisser un fichier orphelin dans ce cas.
    public static function deleteIfLocal(?string $url): void
    {
        if ($url === null) {
            return;
        }
        $prefix = Env::appUrl() . '/uploads/' . self::SUBDIR . '/';
        if (!str_starts_with($url, $prefix)) {
            return;
        }
        $filename = basename($url);
        if ($filename === '' || str_contains($filename, '/')) {
            return;
        }
        $path = self::baseDir() . '/' . $filename;
        if (is_file($path)) {
            @unlink($path);
        }
    }

    private static function baseDir(): string
    {
        return dirname(__DIR__, 3) . '/public/uploads/' . self::SUBDIR;
    }

    private static function extensionFromUrl(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);
        if ($path === null) {
            return null;
        }
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        return $ext !== '' ? $ext : null;
    }
}
