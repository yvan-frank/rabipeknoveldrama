<?php

declare(strict_types=1);

namespace App\Modules\Points;

use App\Lib\Database;
use App\Modules\Chapters\ChaptersService;
use App\Utils\ApiError;
use PDO;
use PDOException;
use Throwable;

/**
 * Équivalent de src/modules/points/points.service.ts.
 */
final class PointsService
{
    private const REASON_REWARDED_AD = 'rewarded_ad';
    private const REASON_DAILY_CHECKIN = 'daily_checkin';
    private const REASON_ARTICLES_TASK = 'articles_task';
    private const REASON_READING_15MIN = 'reading_time_15min';
    private const REASON_READING_30MIN = 'reading_time_30min';
    private const REASON_CHAPTER_UNLOCK = 'chapter_unlock';

    // Paliers quotidiens de temps de lecture (cf. capture de référence :
    // "Lire pendant 15/30 minute"). Le cumul continue de monter après 30 min
    // mais ne déclenche plus aucun crédit — seuls ces deux paliers existent.
    private const READING_MILESTONES = [
        ['minutes' => 15, 'seconds' => 15 * 60, 'points' => 5, 'reason' => self::REASON_READING_15MIN, 'field' => 'milestone_15_credited'],
        ['minutes' => 30, 'seconds' => 30 * 60, 'points' => 10, 'reason' => self::REASON_READING_30MIN, 'field' => 'milestone_30_credited'],
    ];

    // Un incrément client ne peut jamais dépasser cette durée.
    private const MAX_READING_INCREMENT_SECONDS = 120;

    private const ARTICLE_UTM_PARAMS = 'utm_source=rabipek_app&utm_medium=bonus_task&utm_campaign=lisez_3_articles';

    // Liste figée côté serveur (jamais fournie par le client).
    private const ARTICLE_LINKS = [
        ['id' => 'article-1', 'url' => 'https://lequotidiendactu.com/entree-express/residence-permanente-au-canada-1-000-candidats-de-l-experience-canadienne?' . self::ARTICLE_UTM_PARAMS],
        ['id' => 'article-2', 'url' => 'https://lequotidiendactu.com/immigration/presidentielle-2027-immigration-etudiants-etrangers-france?' . self::ARTICLE_UTM_PARAMS],
        ['id' => 'article-3', 'url' => 'https://lequotidiendactu.com/se-preparer-et-vivre-en-france/payer-cvec-une-fois-en-france?' . self::ARTICLE_UTM_PARAMS],
    ];

    private const ARTICLES_TASK_POINTS = 15;

    // Barème du cycle de 7 jours (index 0 = jour 1).
    private const CHECKIN_POINTS_SCHEDULE = [15, 20, 20, 20, 20, 20, 20];

    private const REWARDED_AD_POINTS = 5;
    private const REWARDED_AD_COOLDOWN_SECONDS = 20;
    public const REWARDED_AD_DAILY_CAP = 20;

    private static function db(): PDO
    {
        return Database::connection();
    }

    private static function todayDateOnly(): string
    {
        return gmdate('Y-m-d');
    }

    private static function previousDate(string $date): string
    {
        return gmdate('Y-m-d', strtotime($date . ' UTC') - 86400);
    }

    private static function countRewardedAdsToday(int $userId): int
    {
        $stmt = self::db()->prepare(
            "SELECT COUNT(*) FROM points_transactions WHERE user_id = :userId AND reason = :reason AND created_at >= :startOfDay",
        );
        $stmt->execute(['userId' => $userId, 'reason' => self::REASON_REWARDED_AD, 'startOfDay' => self::todayDateOnly() . ' 00:00:00']);
        return (int) $stmt->fetchColumn();
    }

    public static function getBalance(int $userId): array
    {
        $db = self::db();
        $userStmt = $db->prepare('SELECT points_balance FROM users WHERE id_user = :id');
        $userStmt->execute(['id' => $userId]);
        $balance = $userStmt->fetchColumn();
        if ($balance === false) {
            throw ApiError::notFound('Utilisateur introuvable');
        }

        $countStmt = $db->prepare('SELECT COUNT(*) FROM points_transactions WHERE user_id = :id');
        $countStmt->execute(['id' => $userId]);

        return ['balance' => (int) $balance, 'bonusCount' => (int) $countStmt->fetchColumn()];
    }

    public static function listTransactions(int $userId, int $limit): array
    {
        $stmt = self::db()->prepare('SELECT id, amount, reason, created_at FROM points_transactions WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit');
        $stmt->bindValue('userId', $userId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'amount' => (int) $row['amount'],
            'reason' => $row['reason'],
            'createdAt' => $row['created_at'],
        ], $stmt->fetchAll());
    }

    public static function getRewardedAdStatus(int $userId): array
    {
        return ['watchedToday' => self::countRewardedAdsToday($userId), 'dailyCap' => self::REWARDED_AD_DAILY_CAP];
    }

    public static function creditRewardedAd(int $userId): array
    {
        $db = self::db();
        $lastStmt = $db->prepare(
            'SELECT created_at FROM points_transactions WHERE user_id = :userId AND reason = :reason ORDER BY created_at DESC LIMIT 1',
        );
        $lastStmt->execute(['userId' => $userId, 'reason' => self::REASON_REWARDED_AD]);
        $lastCreatedAt = $lastStmt->fetchColumn();

        if ($lastCreatedAt !== false && (time() - strtotime($lastCreatedAt . ' UTC')) < self::REWARDED_AD_COOLDOWN_SECONDS) {
            throw ApiError::tooManyRequests('Récompense déjà créditée récemment, réessayez dans quelques secondes');
        }

        $watchedToday = self::countRewardedAdsToday($userId);
        if ($watchedToday >= self::REWARDED_AD_DAILY_CAP) {
            throw ApiError::tooManyRequests('Limite quotidienne de pubs récompensées atteinte, revenez demain');
        }

        $balance = self::creditPoints($userId, self::REWARDED_AD_POINTS, self::REASON_REWARDED_AD);

        return ['balance' => $balance, 'earned' => self::REWARDED_AD_POINTS, 'watchedToday' => $watchedToday + 1];
    }

    public static function getCheckInStatus(int $userId): array
    {
        $today = self::todayDateOnly();
        $lastCheckIn = self::fetchLastCheckIn($userId);

        $checkedInToday = $lastCheckIn !== null && $lastCheckIn['checkInDate'] === $today;
        $streakStillValid = $lastCheckIn !== null
            && ($checkedInToday || $lastCheckIn['checkInDate'] === self::previousDate($today));

        return [
            'streakDay' => $streakStillValid ? $lastCheckIn['streakDay'] : 0,
            'checkedInToday' => $checkedInToday,
            'pointsSchedule' => self::CHECKIN_POINTS_SCHEDULE,
        ];
    }

    public static function performCheckIn(int $userId): array
    {
        $db = self::db();
        $today = self::todayDateOnly();
        $lastCheckIn = self::fetchLastCheckIn($userId);

        if ($lastCheckIn !== null && $lastCheckIn['checkInDate'] === $today) {
            throw ApiError::conflict("Check-in déjà effectué aujourd'hui");
        }

        $streakContinues = $lastCheckIn !== null && $lastCheckIn['checkInDate'] === self::previousDate($today);
        $newStreakDay = ($streakContinues && $lastCheckIn['streakDay'] < 7) ? $lastCheckIn['streakDay'] + 1 : 1;
        $points = self::CHECKIN_POINTS_SCHEDULE[$newStreakDay - 1];

        $db->beginTransaction();
        try {
            try {
                $db->prepare('INSERT INTO check_ins (user_id, check_in_date, streak_day, created_at) VALUES (:userId, :date, :streakDay, NOW())')
                    ->execute(['userId' => $userId, 'date' => $today, 'streakDay' => $newStreakDay]);
            } catch (\PDOException $e) {
                // Course entre deux requêtes quasi simultanées : la contrainte
                // unique (user_id, check_in_date) tranche, on la traduit en
                // conflit métier normal.
                if ((int) $e->getCode() === 23000) {
                    throw ApiError::conflict("Check-in déjà effectué aujourd'hui");
                }
                throw $e;
            }

            $balance = self::creditPointsNoTransaction($db, $userId, $points, self::REASON_DAILY_CHECKIN);
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        return ['streakDay' => $newStreakDay, 'earned' => $points, 'balance' => $balance];
    }

    /** @return array{checkInDate:string,streakDay:int}|null */
    private static function fetchLastCheckIn(int $userId): ?array
    {
        $stmt = self::db()->prepare('SELECT check_in_date, streak_day FROM check_ins WHERE user_id = :userId ORDER BY check_in_date DESC LIMIT 1');
        $stmt->execute(['userId' => $userId]);
        $row = $stmt->fetch();
        return $row === false ? null : ['checkInDate' => $row['check_in_date'], 'streakDay' => (int) $row['streak_day']];
    }

    public static function getArticlesStatus(int $userId): array
    {
        $stmt = self::db()->prepare('SELECT article_id FROM article_reads WHERE user_id = :userId');
        $stmt->execute(['userId' => $userId]);
        $readIds = array_flip(array_column($stmt->fetchAll(), 'article_id'));

        return [
            'articles' => array_map(static fn (array $article): array => [
                'id' => $article['id'],
                'url' => $article['url'],
                'read' => isset($readIds[$article['id']]),
            ], self::ARTICLE_LINKS),
        ];
    }

    public static function markArticleRead(int $userId, string $articleId): array
    {
        $db = self::db();

        try {
            $db->prepare('INSERT INTO article_reads (user_id, article_id, read_at) VALUES (:userId, :articleId, NOW())')
                ->execute(['userId' => $userId, 'articleId' => $articleId]);
        } catch (\PDOException $e) {
            if ((int) $e->getCode() === 23000) {
                // Article déjà marqué lu (double ouverture) : pas une erreur,
                // on renvoie juste l'état courant sans re-créditer.
                $countStmt = $db->prepare('SELECT COUNT(*) FROM article_reads WHERE user_id = :userId');
                $countStmt->execute(['userId' => $userId]);
                return ['readCount' => (int) $countStmt->fetchColumn(), 'earned' => 0, 'balance' => null];
            }
            throw $e;
        }

        $countStmt = $db->prepare('SELECT COUNT(*) FROM article_reads WHERE user_id = :userId');
        $countStmt->execute(['userId' => $userId]);
        $readCount = (int) $countStmt->fetchColumn();

        // Ne peut se produire qu'une seule fois par utilisateur : chaque
        // article_id ne peut être inséré qu'une fois (contrainte unique).
        if ($readCount !== count(self::ARTICLE_LINKS)) {
            return ['readCount' => $readCount, 'earned' => 0, 'balance' => null];
        }

        $balance = self::creditPoints($userId, self::ARTICLES_TASK_POINTS, self::REASON_ARTICLES_TASK);

        return ['readCount' => $readCount, 'earned' => self::ARTICLES_TASK_POINTS, 'balance' => $balance];
    }

    public static function getReadingTimeStatus(int $userId): array
    {
        $entry = self::fetchReadingTimeEntry($userId, self::todayDateOnly());
        return ['secondsToday' => $entry['totalSeconds'] ?? 0, 'milestones' => self::readingMilestonesView($entry)];
    }

    public static function addReadingTime(int $userId, int $seconds): array
    {
        $db = self::db();
        $today = self::todayDateOnly();
        $clamped = min(max($seconds, 0), self::MAX_READING_INCREMENT_SECONDS);

        $db->prepare(
            'INSERT INTO daily_reading_time (user_id, date, total_seconds, updated_at) VALUES (:userId, :date, :seconds, NOW())
             ON DUPLICATE KEY UPDATE total_seconds = total_seconds + VALUES(total_seconds), updated_at = NOW()',
        )->execute(['userId' => $userId, 'date' => $today, 'seconds' => $clamped]);

        $entry = self::fetchReadingTimeEntry($userId, $today);

        $newlyReached = array_values(array_filter(
            self::READING_MILESTONES,
            static fn (array $m): bool => $entry['totalSeconds'] >= $m['seconds'] && !$entry[$m['field']],
        ));

        if ($newlyReached === []) {
            return ['secondsToday' => $entry['totalSeconds'], 'earned' => 0, 'balance' => null, 'milestones' => self::readingMilestonesView($entry)];
        }

        $totalPoints = array_sum(array_column($newlyReached, 'points'));

        $db->beginTransaction();
        try {
            foreach ($newlyReached as $milestone) {
                $db->prepare('INSERT INTO points_transactions (user_id, amount, reason, created_at) VALUES (:userId, :amount, :reason, NOW())')
                    ->execute(['userId' => $userId, 'amount' => $milestone['points'], 'reason' => $milestone['reason']]);
            }

            $flagsSet = implode(', ', array_map(static fn (array $m): string => "{$m['field']} = 1", $newlyReached));
            $db->prepare("UPDATE daily_reading_time SET {$flagsSet} WHERE user_id = :userId AND date = :date")
                ->execute(['userId' => $userId, 'date' => $today]);

            $balance = self::creditBalanceOnly($db, $userId, $totalPoints);
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        $updatedEntry = self::fetchReadingTimeEntry($userId, $today);

        return [
            'secondsToday' => $entry['totalSeconds'],
            'earned' => $totalPoints,
            'balance' => $balance,
            'milestones' => self::readingMilestonesView($updatedEntry),
        ];
    }

    /** @return array{totalSeconds:int,milestone_15_credited:bool,milestone_30_credited:bool}|null */
    private static function fetchReadingTimeEntry(int $userId, string $date): ?array
    {
        $stmt = self::db()->prepare('SELECT total_seconds, milestone_15_credited, milestone_30_credited FROM daily_reading_time WHERE user_id = :userId AND date = :date');
        $stmt->execute(['userId' => $userId, 'date' => $date]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }
        return [
            'totalSeconds' => (int) $row['total_seconds'],
            'milestone_15_credited' => (bool) $row['milestone_15_credited'],
            'milestone_30_credited' => (bool) $row['milestone_30_credited'],
        ];
    }

    private static function readingMilestonesView(?array $entry): array
    {
        return array_map(static fn (array $m): array => [
            'minutes' => $m['minutes'],
            'points' => $m['points'],
            'earned' => $entry[$m['field']] ?? false,
        ], self::READING_MILESTONES);
    }

    // Coût réglable globalement (comme author_kyc_bypass_enabled) plutôt que
    // codé en dur — 40 points par défaut, décidé en étude de faisabilité.
    // La ligne id=1 de platform_settings est créée paresseusement à la
    // première lecture, même motif que AuthorsService::getPlatformSettings.
    public static function getChapterUnlockPointsCost(): int
    {
        $db = self::db();
        $db->prepare('INSERT INTO platform_settings (id, updated_at) VALUES (1, NOW()) ON DUPLICATE KEY UPDATE id = id')->execute();
        $stmt = $db->prepare('SELECT chapter_unlock_points_cost FROM platform_settings WHERE id = 1');
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    // Déblocage définitif d'UN chapitre premium contre des points — grain
    // chapitre, complémentaire à l'achat en argent (grain livre/partie, cf.
    // ChaptersService::assertChapterAccess qui accepte les deux). Le débit
    // réutilise creditPointsNoTransaction avec un montant négatif : même
    // mécanisme de crédit, signe inversé, donc même trace auditable dans
    // points_transactions qu'un gain classique.
    public static function unlockChapterWithPoints(int $userId, int $chapterId): array
    {
        $chapter = ChaptersService::getChapterById($chapterId);
        $db = self::db();

        if (self::isChapterFreelyAccessible($chapter) || self::hasAchatAccess($db, $userId, $chapter)) {
            throw ApiError::badRequest('Ce chapitre est déjà accessible, inutile de le débloquer avec des points');
        }

        $checkStmt = $db->prepare('SELECT id FROM chapter_point_unlocks WHERE user_id = :userId AND chapter_id = :chapterId');
        $checkStmt->execute(['userId' => $userId, 'chapterId' => $chapterId]);
        if ($checkStmt->fetchColumn() !== false) {
            throw ApiError::conflict('Ce chapitre est déjà débloqué');
        }

        $cost = self::getChapterUnlockPointsCost();

        $db->beginTransaction();
        try {
            // Verrou de ligne (FOR UPDATE) : sans lui, deux déblocages
            // concurrents pour le même utilisateur pourraient tous deux
            // passer la vérification de solde avant que l'un des deux ne
            // débite, produisant un solde négatif — chaque crédit/débit
            // existant jusqu'ici n'était qu'un incrément, jamais exposé à ce
            // risque de double dépense.
            $balanceStmt = $db->prepare('SELECT points_balance FROM users WHERE id_user = :id FOR UPDATE');
            $balanceStmt->execute(['id' => $userId]);
            $balance = $balanceStmt->fetchColumn();
            if ($balance === false) {
                throw ApiError::notFound('Utilisateur introuvable');
            }
            if ((int) $balance < $cost) {
                throw ApiError::badRequest('Solde de points insuffisant pour débloquer ce chapitre');
            }

            $newBalance = self::creditPointsNoTransaction($db, $userId, -$cost, self::REASON_CHAPTER_UNLOCK);

            try {
                $db->prepare('INSERT INTO chapter_point_unlocks (user_id, chapter_id, points_spent, created_at) VALUES (:userId, :chapterId, :cost, NOW())')
                    ->execute(['userId' => $userId, 'chapterId' => $chapterId, 'cost' => $cost]);
            } catch (PDOException $e) {
                if ((int) $e->getCode() === 23000) {
                    throw ApiError::conflict('Ce chapitre est déjà débloqué');
                }
                throw $e;
            }

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        return ['chapterId' => $chapterId, 'pointsSpent' => $cost, 'balance' => $newBalance];
    }

    /** @param array{chapterNumber:int,partId:?int,part:?array,book:array} $chapter */
    private static function isChapterFreelyAccessible(array $chapter): bool
    {
        if ($chapter['part'] !== null && $chapter['partId'] !== null) {
            if ($chapter['part']['isFree']) {
                return true;
            }
            $countStmt = self::db()->prepare('SELECT COUNT(*) FROM chapters WHERE part_id = :partId AND chapter_number <= :chapterNumber');
            $countStmt->execute(['partId' => $chapter['partId'], 'chapterNumber' => $chapter['chapterNumber']]);
            return (int) $countStmt->fetchColumn() <= $chapter['part']['freeChapterCount'];
        }

        if ($chapter['book']['isFree']) {
            return true;
        }
        return $chapter['chapterNumber'] <= $chapter['book']['freeChapterCount'];
    }

    /** @param array{partId:?int,part:?array,book:array} $chapter */
    private static function hasAchatAccess(PDO $db, int $userId, array $chapter): bool
    {
        if ($chapter['part'] !== null && $chapter['partId'] !== null) {
            $stmt = $db->prepare(
                'SELECT id_achat FROM achat WHERE id_user = :userId AND (part_id = :partId OR (id_book = :bookId AND part_id IS NULL)) LIMIT 1',
            );
            $stmt->execute(['userId' => $userId, 'partId' => $chapter['partId'], 'bookId' => $chapter['book']['id']]);
            return $stmt->fetchColumn() !== false;
        }

        $stmt = $db->prepare('SELECT id_achat FROM achat WHERE id_book = :bookId AND id_user = :userId LIMIT 1');
        $stmt->execute(['bookId' => $chapter['book']['id'], 'userId' => $userId]);
        return $stmt->fetchColumn() !== false;
    }

    private static function creditPoints(int $userId, int $amount, string $reason): int
    {
        $db = self::db();
        $db->beginTransaction();
        try {
            $balance = self::creditPointsNoTransaction($db, $userId, $amount, $reason);
            $db->commit();
            return $balance;
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    private static function creditPointsNoTransaction(PDO $db, int $userId, int $amount, string $reason): int
    {
        $db->prepare('INSERT INTO points_transactions (user_id, amount, reason, created_at) VALUES (:userId, :amount, :reason, NOW())')
            ->execute(['userId' => $userId, 'amount' => $amount, 'reason' => $reason]);
        return self::creditBalanceOnly($db, $userId, $amount);
    }

    private static function creditBalanceOnly(PDO $db, int $userId, int $amount): int
    {
        $db->prepare('UPDATE users SET points_balance = points_balance + :amount WHERE id_user = :userId')
            ->execute(['amount' => $amount, 'userId' => $userId]);
        $stmt = $db->prepare('SELECT points_balance FROM users WHERE id_user = :userId');
        $stmt->execute(['userId' => $userId]);
        return (int) $stmt->fetchColumn();
    }
}
