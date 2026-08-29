<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Helpers de réponse HTTP pour des pages rendues côté serveur (pas de JSON
 * ici — cf. refonte_server_php\Http\Response pour l'API).
 */
final class Response
{
    public static function redirect(string $location, int $status = 302): never
    {
        http_response_code($status);
        header('Location: ' . $location);
        exit;
    }

    public static function notFound(): never
    {
        http_response_code(404);
        require dirname(__DIR__, 2) . '/resources/views/errors/404.php';
        exit;
    }

    public static function html(string $html, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
        exit;
    }

    public static function xml(string $xml, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/xml; charset=utf-8');
        echo $xml;
        exit;
    }

    public static function text(string $text, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: text/plain; charset=utf-8');
        echo $text;
        exit;
    }
}
