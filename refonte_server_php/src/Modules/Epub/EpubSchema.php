<?php

declare(strict_types=1);

namespace App\Modules\Epub;

use App\Utils\ApiError;

/**
 * Équivalent de src/modules/epub/epub.schema.ts.
 */
final class EpubSchema
{
    public static function idParam(string $raw): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest('Identifiant invalide');
        }
        return (int) $raw;
    }
}
