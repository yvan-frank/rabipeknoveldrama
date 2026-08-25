<?php

declare(strict_types=1);

namespace App\Utils;

use RuntimeException;

/**
 * Équivalent direct de src/utils/ApiError.ts.
 */
final class ApiError extends RuntimeException
{
    public function __construct(
        public readonly int $statusCode,
        string $message,
        public readonly mixed $details = null,
    ) {
        parent::__construct($message);
    }

    public static function badRequest(string $message = 'Requête invalide', mixed $details = null): self
    {
        return new self(400, $message, $details);
    }

    public static function unauthorized(string $message = 'Non authentifié'): self
    {
        return new self(401, $message);
    }

    public static function forbidden(string $message = 'Accès refusé'): self
    {
        return new self(403, $message);
    }

    public static function notFound(string $message = 'Ressource introuvable'): self
    {
        return new self(404, $message);
    }

    public static function conflict(string $message = 'Conflit avec une ressource existante'): self
    {
        return new self(409, $message);
    }

    public static function tooManyRequests(string $message = 'Trop de requêtes, réessayez plus tard'): self
    {
        return new self(429, $message);
    }

    public static function internal(string $message = 'Erreur interne du serveur'): self
    {
        return new self(500, $message);
    }
}
