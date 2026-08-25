<?php

declare(strict_types=1);

namespace App\Modules\Support;

use App\Utils\ApiError;
use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/support/support.schema.ts.
 */
final class SupportSchema
{
    public static function userIdParam(string $raw): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest('Identifiant utilisateur invalide');
        }
        return (int) $raw;
    }

    /** @param array<string,mixed> $body */
    public static function messageContent(array $body): string
    {
        $content = is_string($body['content'] ?? null) ? trim($body['content']) : '';
        if (mb_strlen($content) < 1 || mb_strlen($content) > 2000) {
            throw new ValidationException(['content' => ['Doit faire entre 1 et 2000 caractères']]);
        }
        return $content;
    }
}
