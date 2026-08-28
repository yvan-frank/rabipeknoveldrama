<?php

declare(strict_types=1);

namespace App\Utils;

/**
 * Vérifie un idToken Google (JWT RS256 signé par Google) via l'endpoint
 * tokeninfo — pas d'implémentation JWK/RS256 maison (Jwt.php ne fait que du
 * HS256, symétrique) : Google valide déjà signature/expiration pour nous, il
 * ne reste qu'à vérifier que le jeton nous est bien destiné (aud) et vient
 * bien de Google (iss), comme recommandé par leur documentation OAuth2.
 */
final class GoogleTokenVerifier
{
    private const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

    /**
     * @return array{sub:string,email:string,name:?string,picture:?string}
     * @throws ApiError si le jeton est invalide, expiré, ou destiné à une autre application
     */
    public static function verify(string $idToken, string $expectedAudience): array
    {
        $ch = curl_init(self::TOKENINFO_URL . '?id_token=' . urlencode($idToken));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
        ]);
        $raw = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $error !== '') {
            throw ApiError::unauthorized('Vérification du jeton Google impossible (réseau)');
        }

        $payload = json_decode($raw, true);
        if ($status !== 200 || !is_array($payload)) {
            throw ApiError::unauthorized('Jeton Google invalide ou expiré');
        }

        if (($payload['aud'] ?? null) !== $expectedAudience) {
            throw ApiError::unauthorized('Jeton Google destiné à une autre application');
        }
        if (!in_array($payload['iss'] ?? null, ['accounts.google.com', 'https://accounts.google.com'], true)) {
            throw ApiError::unauthorized('Jeton Google invalide (émetteur)');
        }
        if (($payload['email_verified'] ?? 'false') !== 'true' || empty($payload['email'])) {
            throw ApiError::unauthorized('Email Google non vérifié');
        }

        return [
            'sub' => (string) $payload['sub'],
            'email' => (string) $payload['email'],
            'name' => $payload['name'] ?? null,
            'picture' => $payload['picture'] ?? null,
        ];
    }
}
