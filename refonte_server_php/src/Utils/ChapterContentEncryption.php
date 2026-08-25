<?php

declare(strict_types=1);

namespace App\Utils;

use App\Config\Env;

/**
 * Équivalent de src/utils/chapter-content-encryption.ts. Même format
 * autoportant AES-256-GCM : "rabipek:chapter:v1:{iv}:{tag}:{cipher}", chaque
 * segment encodé en base64url — interopérable avec le contenu déjà chiffré
 * par le serveur Node (même clé CONTENT_ENCRYPTION_KEY).
 */
final class ChapterContentEncryption
{
    private const PREFIX = 'rabipek:chapter:v1:';
    private const IV_LENGTH = 12;
    private const AUTH_TAG_LENGTH = 16;

    public static function isEncrypted(string $value): bool
    {
        return str_starts_with($value, self::PREFIX);
    }

    public static function encrypt(string $plainText): string
    {
        $key = self::key();
        $iv = random_bytes(self::IV_LENGTH);

        $cipherText = openssl_encrypt($plainText, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag, '', self::AUTH_TAG_LENGTH);
        if ($cipherText === false) {
            throw ApiError::internal('Impossible de chiffrer le contenu du chapitre');
        }

        return self::PREFIX . self::base64UrlEncode($iv) . ':' . self::base64UrlEncode($tag) . ':' . self::base64UrlEncode($cipherText);
    }

    // Compatibilité contrôlée le temps d'exécuter la migration : les anciens
    // chapitres en clair restent lisibles, toute nouvelle écriture est chiffrée.
    public static function decrypt(string $storedValue): string
    {
        if (!self::isEncrypted($storedValue)) {
            return $storedValue;
        }

        $parts = explode(':', substr($storedValue, strlen(self::PREFIX)));
        if (count($parts) !== 3) {
            throw ApiError::internal('Le contenu chiffré du chapitre est invalide');
        }
        [$encodedIv, $encodedTag, $encodedContent] = $parts;

        $key = self::key();
        $plainText = openssl_decrypt(
            self::base64UrlDecode($encodedContent),
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            self::base64UrlDecode($encodedIv),
            self::base64UrlDecode($encodedTag),
        );

        if ($plainText === false) {
            throw ApiError::internal('Impossible de déchiffrer le contenu du chapitre');
        }

        return $plainText;
    }

    private static function key(): string
    {
        $configured = Env::get('CONTENT_ENCRYPTION_KEY');
        if ($configured === null || $configured === '') {
            throw ApiError::internal('CONTENT_ENCRYPTION_KEY est requis pour manipuler le contenu des chapitres');
        }

        $key = base64_decode($configured, true);
        if ($key === false || strlen($key) !== 32) {
            throw ApiError::internal('CONTENT_ENCRYPTION_KEY doit être une clé AES-256 encodée en base64');
        }

        return $key;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        $padded = str_pad(strtr($data, '-_', '+/'), strlen($data) % 4 === 0 ? strlen($data) : strlen($data) + (4 - strlen($data) % 4), '=');
        return base64_decode($padded) ?: '';
    }
}
