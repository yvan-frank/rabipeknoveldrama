<?php

declare(strict_types=1);

namespace App\Utils;

/**
 * JWT HS256 minimal, sans dépendance externe (équivalent natif de
 * jsonwebtoken côté Node — seul l'algorithme utilisé par ce projet est
 * implémenté).
 */
final class Jwt
{
    /** @param array<string,mixed> $payload */
    public static function sign(array $payload, string $secret, int $ttlSeconds): string
    {
        $header = self::base64UrlEncode((string) json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + $ttlSeconds;
        $encodedPayload = self::base64UrlEncode((string) json_encode($payload));

        $signature = hash_hmac('sha256', "{$header}.{$encodedPayload}", $secret, true);
        $encodedSignature = self::base64UrlEncode($signature);

        return "{$header}.{$encodedPayload}.{$encodedSignature}";
    }

    /**
     * @return array<string,mixed>
     * @throws ApiError si le jeton est absent, malformé, mal signé ou expiré.
     */
    public static function verify(string $token, string $secret): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw ApiError::unauthorized('Session invalide ou expirée');
        }
        [$header, $payload, $signature] = $parts;

        $expectedSignature = self::base64UrlEncode(hash_hmac('sha256', "{$header}.{$payload}", $secret, true));
        if (!hash_equals($expectedSignature, $signature)) {
            throw ApiError::unauthorized('Session invalide ou expirée');
        }

        $decoded = json_decode(self::base64UrlDecode($payload), true);
        if (!is_array($decoded)) {
            throw ApiError::unauthorized('Session invalide ou expirée');
        }

        if (isset($decoded['exp']) && time() >= (int) $decoded['exp']) {
            throw ApiError::unauthorized('Session invalide ou expirée');
        }

        return $decoded;
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
