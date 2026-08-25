<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Enveloppe la requête HTTP courante. `params` porte les segments dynamiques
 * de route (:id), `body`/`query` le payload validé (cf. Validator), `user`
 * l'utilisateur authentifié posé par AuthMiddleware — équivalent de
 * req.params / req.body / req.query / req.user côté Express.
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

    /** @var array<string,mixed>|null */
    public ?array $user = null;

    /** @var array{filename:string}|null posé par UploadMiddleware */
    public ?array $file = null;

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
            if (trim($raw) === '') {
                return [];
            }
            $decoded = json_decode($raw, true);
            return is_array($decoded) ? $decoded : [];
        }

        if (str_contains($contentType, 'multipart/form-data') || str_contains($contentType, 'application/x-www-form-urlencoded')) {
            return $_POST;
        }

        return [];
    }

    public function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$key] ?? null;
    }

    public function ip(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    public function bearerToken(): ?string
    {
        $header = $this->header('Authorization');
        if ($header !== null && str_starts_with($header, 'Bearer ')) {
            return trim(substr($header, strlen('Bearer ')));
        }
        return null;
    }
}
