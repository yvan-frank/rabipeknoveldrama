<?php

declare(strict_types=1);

namespace App\Modules\Stats;

use App\Utils\ApiError;

/**
 * Équivalent de src/modules/stats/stats.schema.ts.
 */
final class StatsSchema
{
    public static function bookIdParam(string $raw): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest('Identifiant de livre invalide');
        }
        return (int) $raw;
    }

    /** @param array<string,mixed> $query */
    public static function viewStatsQuery(array $query): array
    {
        $groupBy = $query['groupBy'] ?? 'day';
        if (!in_array($groupBy, ['day', 'country', 'platform'], true)) {
            throw ApiError::badRequest('groupBy invalide (day, country ou platform attendu)');
        }

        return [
            'from' => self::optionalDate($query['from'] ?? null),
            'to' => self::optionalDate($query['to'] ?? null),
            'groupBy' => $groupBy,
        ];
    }

    private static function optionalDate(mixed $value): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }
        $timestamp = strtotime($value);
        if ($timestamp === false) {
            throw ApiError::badRequest('Date invalide');
        }
        return date('Y-m-d H:i:s', $timestamp);
    }
}
