<?php

declare(strict_types=1);

namespace App\Config;

/**
 * Équivalent de src/config/cors.ts. Appliqué en tout début de requête dans
 * public/index.php, avant toute autre logique (y compris pour OPTIONS).
 */
final class Cors
{
    public static function apply(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
        $allowed = Env::list('CORS_ORIGINS');

        // Requêtes sans Origin (curl, apps mobiles, healthchecks) autorisées,
        // comme côté Node.
        if ($origin !== null && !in_array($origin, $allowed, true)) {
            return;
        }

        if ($origin !== null) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        // Permet au client JS de lire le jeton invité posé par guestOrAuth.
        header('Access-Control-Expose-Headers: X-Guest-Token');

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
