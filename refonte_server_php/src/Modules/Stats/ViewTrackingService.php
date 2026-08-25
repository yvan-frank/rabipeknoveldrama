<?php

declare(strict_types=1);

namespace App\Modules\Stats;

use App\Config\Env;
use App\Lib\Database;
use PDO;
use Throwable;

/**
 * Équivalent de src/modules/stats/view-tracking.service.ts — implémentation
 * canonique du comptage de vues, avec ventilation par jour/pays/plateforme.
 * Utilisée à la fois par ce module (lecture des stats) et par
 * BooksService::getBookDetailForViewer (incrément à l'affichage public d'un
 * livre), exactement comme côté Node où books.service.ts importe
 * trackBookView depuis ce même fichier.
 */
final class ViewTrackingService
{
    private const DEDUPLICATION_WINDOW_MINUTES = 30;

    private static function db(): PDO
    {
        return Database::connection();
    }

    /**
     * @param array{userId:?int,ip:string,userAgent:?string,country:?string} $context
     */
    public static function trackBookView(int $bookId, array $context): int
    {
        $db = self::db();
        $visitorHash = hash_hmac('sha256', ($context['userId'] ?? 'anonymous') . ':' . $context['ip'], Env::jwtSecret());
        $since = date('Y-m-d H:i:s', time() - self::DEDUPLICATION_WINDOW_MINUTES * 60);

        $dedup = $db->prepare('SELECT id FROM book_view_events WHERE book_id = :bookId AND visitor_hash = :hash AND viewed_at >= :since LIMIT 1');
        $dedup->execute(['bookId' => $bookId, 'hash' => $visitorHash, 'since' => $since]);

        if ($dedup->fetchColumn() !== false) {
            return self::currentTotal($db, $bookId);
        }

        $country = self::normalizedCountry($context['country'] ?? null);
        $platform = self::platformFromUserAgent($context['userAgent'] ?? '');
        $viewDate = gmdate('Y-m-d');

        $db->beginTransaction();
        try {
            $db->prepare(
                'INSERT INTO book_view_events (book_id, user_id, visitor_hash, country, platform, viewed_at)
                 VALUES (:bookId, :userId, :hash, :country, :platform, NOW())',
            )->execute([
                'bookId' => $bookId,
                'userId' => $context['userId'],
                'hash' => $visitorHash,
                'country' => $country,
                'platform' => $platform,
            ]);

            $db->prepare(
                'INSERT INTO viewbooks (book_id, view_number) VALUES (:bookId, 1)
                 ON DUPLICATE KEY UPDATE view_number = view_number + 1',
            )->execute(['bookId' => $bookId]);

            $db->prepare(
                'INSERT INTO views_book_per_day (book_id, view_date, views, platform) VALUES (:bookId, :viewDate, 1, :platform)
                 ON DUPLICATE KEY UPDATE views = views + 1',
            )->execute(['bookId' => $bookId, 'viewDate' => $viewDate, 'platform' => $platform]);

            if ($country !== null) {
                $db->prepare(
                    'INSERT INTO views_books_by_country (book_id, country, total_views, last_updated) VALUES (:bookId, :country, 1, NOW())
                     ON DUPLICATE KEY UPDATE total_views = total_views + 1, last_updated = NOW()',
                )->execute(['bookId' => $bookId, 'country' => $country]);
            }

            $db->prepare(
                'INSERT INTO views_books_by_platform (book_id, platform, total_views, last_updated) VALUES (:bookId, :platform, 1, NOW())
                 ON DUPLICATE KEY UPDATE total_views = total_views + 1, last_updated = NOW()',
            )->execute(['bookId' => $bookId, 'platform' => $platform]);

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        return self::currentTotal($db, $bookId);
    }

    private static function currentTotal(PDO $db, int $bookId): int
    {
        $stmt = $db->prepare('SELECT view_number FROM viewbooks WHERE book_id = :bookId');
        $stmt->execute(['bookId' => $bookId]);
        return (int) ($stmt->fetchColumn() ?: 0);
    }

    private static function normalizedCountry(?string $country): ?string
    {
        $value = strtoupper(trim((string) $country));
        return preg_match('/^[A-Z]{2}$/', $value) === 1 ? $value : null;
    }

    private static function platformFromUserAgent(string $userAgent): string
    {
        if (preg_match('/bot|crawler|spider|facebookexternalhit/i', $userAgent) === 1) {
            return 'bot';
        }
        if (preg_match('/ipad|tablet/i', $userAgent) === 1) {
            return 'tablet';
        }
        if (preg_match('/mobi|android|iphone/i', $userAgent) === 1) {
            return 'mobile';
        }
        return 'desktop';
    }
}
