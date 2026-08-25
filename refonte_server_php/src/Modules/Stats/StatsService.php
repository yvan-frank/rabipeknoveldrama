<?php

declare(strict_types=1);

namespace App\Modules\Stats;

use App\Lib\Database;
use App\Utils\ApiError;
use App\Utils\Ownership;
use PDO;

/**
 * Équivalent de src/modules/stats/stats.service.ts.
 */
final class StatsService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    /** @param array<string,mixed> $user */
    private static function assertStatsAccess(int $bookId, array $user): void
    {
        $stmt = self::db()->prepare('SELECT id_author FROM books WHERE id_book = :id');
        $stmt->execute(['id' => $bookId]);
        $authorId = $stmt->fetchColumn();
        if ($authorId === false) {
            throw ApiError::notFound('Livre introuvable');
        }
        Ownership::assertAuthorOwnership($user, (int) $authorId);
    }

    /** @param array<string,mixed> $user */
    public static function getBookStatsSummary(int $bookId, array $user): array
    {
        self::assertStatsAccess($bookId, $user);
        $db = self::db();

        $viewsStmt = $db->prepare('SELECT view_number FROM viewbooks WHERE book_id = :id');
        $viewsStmt->execute(['id' => $bookId]);
        $totalViews = $viewsStmt->fetchColumn();

        $countQueries = [
            'events' => 'SELECT COUNT(*) FROM book_view_events WHERE book_id = :id',
            'reads' => 'SELECT COUNT(*) FROM readbook WHERE id_book = :id',
            'likes' => 'SELECT COUNT(*) FROM likes WHERE id_book = :id',
            'shares' => 'SELECT COUNT(*) FROM shares WHERE id_book = :id',
        ];
        $counts = [];
        foreach ($countQueries as $key => $sql) {
            $stmt = $db->prepare($sql);
            $stmt->execute(['id' => $bookId]);
            $counts[$key] = (int) $stmt->fetchColumn();
        }

        $purchasesStmt = $db->prepare('SELECT COUNT(*) AS cnt, COALESCE(SUM(price), 0) AS revenue FROM achat WHERE id_book = :id AND is_free = 0');
        $purchasesStmt->execute(['id' => $bookId]);
        $purchases = $purchasesStmt->fetch();

        return [
            'totalViews' => $totalViews !== false ? (int) $totalViews : 0,
            'uniqueTrackedViews' => $counts['events'],
            'reads' => $counts['reads'],
            'likes' => $counts['likes'],
            'shares' => $counts['shares'],
            'purchases' => (int) $purchases['cnt'],
            'revenue' => (int) $purchases['revenue'],
        ];
    }

    /**
     * @param array{from:?string,to:?string,groupBy:string} $query
     * @param array<string,mixed> $user
     */
    public static function getBookViewStats(int $bookId, array $query, array $user): array
    {
        self::assertStatsAccess($bookId, $user);
        $db = self::db();

        if ($query['groupBy'] === 'day') {
            $conditions = ['book_id = :bookId'];
            $params = ['bookId' => $bookId];
            if ($query['from'] !== null) {
                $conditions[] = 'view_date >= :from';
                $params['from'] = $query['from'];
            }
            if ($query['to'] !== null) {
                $conditions[] = 'view_date <= :to';
                $params['to'] = $query['to'];
            }

            $stmt = $db->prepare('SELECT view_date, views FROM views_book_per_day WHERE ' . implode(' AND ', $conditions) . ' ORDER BY view_date ASC');
            $stmt->execute($params);

            return array_map(static fn (array $row): array => [
                'viewDate' => $row['view_date'],
                'views' => (int) $row['views'],
            ], $stmt->fetchAll());
        }

        $column = $query['groupBy'] === 'country' ? 'country' : 'platform';
        $conditions = ['book_id = :bookId'];
        $params = ['bookId' => $bookId];
        if ($query['from'] !== null) {
            $conditions[] = 'viewed_at >= :from';
            $params['from'] = $query['from'];
        }
        if ($query['to'] !== null) {
            $conditions[] = 'viewed_at <= :to';
            $params['to'] = $query['to'];
        }

        $stmt = $db->prepare(
            "SELECT {$column}, COUNT(*) AS count FROM book_view_events WHERE " . implode(' AND ', $conditions)
            . " GROUP BY {$column} ORDER BY count DESC",
        );
        $stmt->execute($params);

        return array_map(static fn (array $row) => [$column => $row[$column], 'count' => (int) $row['count']], $stmt->fetchAll());
    }
}
