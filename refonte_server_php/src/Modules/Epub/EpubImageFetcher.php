<?php

declare(strict_types=1);

namespace App\Modules\Epub;

use App\Config\Env;
use RuntimeException;

/**
 * Équivalent de la partie téléchargement d'image de epub.service.ts
 * (resolveLocalImageUrl + downloadImage).
 */
final class EpubImageFetcher
{
    private const MAX_BYTES = 10 * 1024 * 1024;
    private const EXTENSION_BY_TYPE = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    /** @return array{sourceUrl:string,content:string,mediaType:string,extension:string} */
    public static function download(string $value): array
    {
        $sourceUrl = self::resolveAllowedUrl($value);

        $ch = curl_init($sourceUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_MAXREDIRS => 0,
            CURLOPT_USERAGENT => 'RabipekEpubGenerator/1.0 (+https://rabipeknovel.com)',
        ]);
        $content = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($content === false || $status !== 200) {
            throw new RuntimeException("Image inaccessible ({$status}) : {$value}" . ($error !== '' ? " ({$error})" : ''));
        }

        $mediaType = strtolower(trim(explode(';', (string) $contentType)[0] ?? ''));
        $extension = self::EXTENSION_BY_TYPE[$mediaType] ?? null;
        if ($extension === null) {
            throw new RuntimeException("Format d'image non supporté (" . ($mediaType !== '' ? $mediaType : 'inconnu') . ") : {$value}");
        }

        if ($content === '' || strlen($content) > self::MAX_BYTES) {
            throw new RuntimeException("Image vide ou trop volumineuse : {$value}");
        }

        return ['sourceUrl' => $sourceUrl, 'content' => $content, 'mediaType' => $mediaType, 'extension' => $extension];
    }

    // Protection SSRF : seules les images de l'application elle-même ou d'un
    // hôte explicitement autorisé (EPUB_EXTERNAL_IMAGE_HOSTS) peuvent être
    // récupérées lors de la génération EPUB.
    private static function resolveAllowedUrl(string $value): string
    {
        $appUrl = Env::appUrl();
        $resolved = self::resolveRelative($value, $appUrl);
        $parts = parse_url($resolved);
        if ($parts === false || !isset($parts['scheme'], $parts['host'])) {
            throw new RuntimeException("URL d'image invalide : {$value}");
        }

        $scheme = strtolower($parts['scheme']);
        if (!in_array($scheme, ['http', 'https'], true)) {
            throw new RuntimeException("Domaine image non autorisé : {$parts['host']}. Ajoutez-le à EPUB_EXTERNAL_IMAGE_HOSTS si nécessaire.");
        }

        $appParts = parse_url($appUrl);
        $isSameApplication = isset($appParts['host'])
            && strcasecmp($parts['host'], $appParts['host']) === 0
            && ($parts['port'] ?? self::defaultPort($scheme)) === ($appParts['port'] ?? self::defaultPort(strtolower($appParts['scheme'] ?? 'http')));

        $allowedHosts = Env::list('EPUB_EXTERNAL_IMAGE_HOSTS');
        $hostLower = strtolower($parts['host']);
        $hostWithPort = $hostLower . (isset($parts['port']) ? ':' . $parts['port'] : '');
        $isAllowedExternalHost = in_array($hostLower, $allowedHosts, true) || in_array($hostWithPort, $allowedHosts, true);

        if (!$isSameApplication && !$isAllowedExternalHost) {
            throw new RuntimeException("Domaine image non autorisé : {$parts['host']}. Ajoutez-le à EPUB_EXTERNAL_IMAGE_HOSTS si nécessaire.");
        }

        return $resolved;
    }

    private static function resolveRelative(string $value, string $base): string
    {
        if (preg_match('#^https?://#i', $value) === 1) {
            return $value;
        }
        return rtrim($base, '/') . '/' . ltrim($value, '/');
    }

    private static function defaultPort(string $scheme): int
    {
        return $scheme === 'https' ? 443 : 80;
    }
}
