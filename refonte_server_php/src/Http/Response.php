<?php

declare(strict_types=1);

namespace App\Http;

use App\Config\Env;

/**
 * Helpers de réponse — même enveloppe JSON que le serveur Node
 * ({success, data} / {success:false, message, errors?}).
 */
final class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(mixed $data = null, int $status = 200): never
    {
        self::json(['success' => true, 'data' => $data], $status);
    }

    public static function noContent(): never
    {
        http_response_code(204);
        exit;
    }

    public static function cookie(string $name, string $value, int $maxAgeSeconds): void
    {
        setcookie($name, $value, [
            'expires' => time() + $maxAgeSeconds,
            'path' => '/',
            'httponly' => true,
            'secure' => Env::isProduction(),
            'samesite' => 'Lax',
        ]);
    }

    public static function clearCookie(string $name): void
    {
        setcookie($name, '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'secure' => Env::isProduction(),
            'samesite' => 'Lax',
        ]);
    }
}
