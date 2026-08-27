<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Enveloppe la requête HTTP courante. `params` porte les segments dynamiques
 * de route (:slug, :id, :numero) — équivalent des params de page Next.js
 * (ex. app/livres/[slug]/page.tsx).
 */
final class Request
{
    /** @var array<string,string> */
    public array $params = [];

    /** @var array<string,mixed> */
    public array $query;

    /** @var array<string,mixed> */
    public array $body;

    /** @var array<string,string> */
    public array $cookies;

    private function __construct(
        public readonly string $method,
        public readonly string $path,
    ) {
    }

    public static function fromGlobals(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = rtrim((string) parse_url($uri, PHP_URL_PATH), '/');
        $path = $path === '' ? '/' : $path;

        $request = new self($method, $path);
        $request->query = $_GET;
        $request->cookies = $_COOKIE;
        $request->body = self::parseBody($method);

        return $request;
    }

    /** @return array<string,mixed> */
    private static function parseBody(string $method): array
    {
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return [];
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input') ?: '';
            $decoded = trim($raw) === '' ? [] : json_decode($raw, true);
            return is_array($decoded) ? $decoded : [];
        }

        return $_POST;
    }

    public function sessionToken(): ?string
    {
        $name = \App\Config\Env::cookieName();
        return $this->cookies[$name] ?? null;
    }
}
