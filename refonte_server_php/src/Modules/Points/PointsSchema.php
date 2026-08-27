<?php

declare(strict_types=1);

namespace App\Modules\Points;

use App\Utils\ApiError;
use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/points/points.schema.ts.
 */
final class PointsSchema
{
    private const ARTICLE_IDS = ['article-1', 'article-2', 'article-3'];

    /** @param array<string,mixed> $query */
    public static function listTransactionsQuery(array $query): int
    {
        $limit = filter_var($query['limit'] ?? null, FILTER_VALIDATE_INT);
        if ($limit === false || $limit < 1 || $limit > 100) {
            return 20;
        }
        return $limit;
    }

    public static function chapterIdParam(string $raw): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest('Identifiant de chapitre invalide');
        }
        return (int) $raw;
    }

    public static function articleIdParam(string $raw): string
    {
        if (!in_array($raw, self::ARTICLE_IDS, true)) {
            throw ApiError::badRequest('Identifiant d\'article invalide');
        }
        return $raw;
    }

    /** @param array<string,mixed> $body */
    public static function addReadingTime(array $body): int
    {
        $seconds = filter_var($body['seconds'] ?? null, FILTER_VALIDATE_INT);
        if ($seconds === false || $seconds < 1 || $seconds > 120) {
            throw new ValidationException(['seconds' => ['Doit être un entier entre 1 et 120']]);
        }
        return $seconds;
    }
}
