<?php

declare(strict_types=1);

namespace App\Modules\Chapters;

use App\Lib\Database;
use App\Utils\ApiError;
use App\Utils\ChapterContentEncryption;
use App\Utils\Ownership;
use PDO;
use Throwable;

/**
 * Équivalent de src/modules/chapters/chapters.service.ts.
 */
final class ChaptersService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    /** @return array{id:int,authorId:int} */
    private static function getBookOrThrow(int $bookId): array
    {
        $stmt = self::db()->prepare('SELECT id_book, id_author FROM books WHERE id_book = :id');
        $stmt->execute(['id' => $bookId]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Livre introuvable');
        }
        return ['id' => (int) $row['id_book'], 'authorId' => (int) $row['id_author']];
    }

    // Contenu volontairement exclu de la liste : potentiellement très
    // volumineux (longtext) et inutile pour un sommaire de chapitres.
    public static function listChaptersByBook(int $bookId): array
    {
        self::getBookOrThrow($bookId);

        $stmt = self::db()->prepare(
            'SELECT id_chapter AS id, chapter_title AS title, chapter_number AS chapterNumber, part_id AS partId
             FROM chapters WHERE id_book = :bookId ORDER BY chapter_number ASC',
        );
        $stmt->execute(['bookId' => $bookId]);

        return array_map(self::mapChapterSummary(...), $stmt->fetchAll());
    }

    private static function assertPartBelongsToBook(?int $partId, int $bookId): void
    {
        if ($partId === null) {
            return;
        }
        $stmt = self::db()->prepare('SELECT id_book_part FROM book_parts WHERE id_book_part = :id AND book_id = :bookId');
        $stmt->execute(['id' => $partId, 'bookId' => $bookId]);
        if ($stmt->fetchColumn() === false) {
            throw ApiError::badRequest('Cette partie ne correspond pas au livre du chapitre');
        }
    }

    // Version "légère" (ownership checks update/delete) — sans vérification
    // d'accès lecteur ni déchiffrement. cf. getChapterForViewer/getChapterForManage.
    public static function getChapterById(int $id): array
    {
        $stmt = self::db()->prepare(
            'SELECT ch.id_chapter, ch.chapter_title, ch.content, ch.chapter_number, ch.id_book, ch.part_id,
                    b.title AS book_title, b.id_author AS book_author_id, b.is_free AS book_is_free, b.free_chapter_count AS book_free_chapter_count,
                    bp.id_book_part AS part_row_id, bp.title AS part_title, bp.part_number AS part_number,
                    bp.is_free AS part_is_free, bp.free_chapter_count AS part_free_chapter_count, bp.price AS part_price
             FROM chapters ch
             JOIN books b ON b.id_book = ch.id_book
             LEFT JOIN book_parts bp ON bp.id_book_part = ch.part_id
             WHERE ch.id_chapter = :id',
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Chapitre introuvable');
        }

        return self::mapFullChapter($row);
    }

    /** @param array<string,mixed> $actingUser */
    public static function getChapterForManage(int $id, array $actingUser): array
    {
        $chapter = self::getChapterById($id);
        Ownership::assertAuthorOwnership($actingUser, $chapter['book']['authorId']);
        $chapter['content'] = ChapterContentEncryption::decrypt($chapter['content']);
        return $chapter;
    }

    /**
     * Paywall : la lecture exige toujours d'être connecté, y compris pour un
     * livre gratuit ou les premiers chapitres "aperçu" d'un livre payant
     * (401 si anonyme). Une fois connecté, ces chapitres restent lisibles
     * sans achat ; au-delà, il faut avoir acheté le livre/la partie (403
     * sinon) — les admins passent toujours.
     *
     * @param array{chapterNumber:int,partId:?int,part:?array,book:array} $chapter
     * @param array{id:int,role:string}|null $viewer
     */
    private static function assertChapterAccess(array $chapter, ?array $viewer): void
    {
        if ($viewer === null) {
            throw ApiError::unauthorized('Connectez-vous pour lire ce chapitre');
        }

        if ($viewer['role'] === 'admin') {
            return;
        }

        $db = self::db();

        if ($chapter['part'] !== null && $chapter['partId'] !== null) {
            if ($chapter['part']['isFree']) {
                return;
            }

            $countStmt = $db->prepare('SELECT COUNT(*) FROM chapters WHERE part_id = :partId AND chapter_number <= :chapterNumber');
            $countStmt->execute(['partId' => $chapter['partId'], 'chapterNumber' => $chapter['chapterNumber']]);
            $precedingChapterCount = (int) $countStmt->fetchColumn();
            if ($precedingChapterCount <= $chapter['part']['freeChapterCount']) {
                return;
            }

            $purchaseStmt = $db->prepare(
                'SELECT id_achat FROM achat WHERE id_user = :userId AND (part_id = :partId OR (id_book = :bookId AND part_id IS NULL)) LIMIT 1',
            );
            $purchaseStmt->execute(['userId' => $viewer['id'], 'partId' => $chapter['partId'], 'bookId' => $chapter['book']['id']]);
            if ($purchaseStmt->fetchColumn() === false) {
                throw ApiError::forbidden('Achetez cette partie pour lire ce chapitre');
            }
            return;
        }

        if ($chapter['book']['isFree']) {
            return;
        }
        if ($chapter['chapterNumber'] <= $chapter['book']['freeChapterCount']) {
            return;
        }

        $purchaseStmt = $db->prepare('SELECT id_achat FROM achat WHERE id_book = :bookId AND id_user = :userId LIMIT 1');
        $purchaseStmt->execute(['bookId' => $chapter['book']['id'], 'userId' => $viewer['id']]);
        if ($purchaseStmt->fetchColumn() === false) {
            throw ApiError::forbidden('Achetez ce livre pour lire ce chapitre');
        }
    }

    // Best-effort : une erreur ici ne doit jamais faire échouer la lecture du
    // chapitre. Le pourcentage n'est remis à 0 que lors d'un changement de
    // chapitre (une simple relecture ne doit pas écraser la position déjà
    // enregistrée via setReadingProgress).
    private static function recordReadingProgress(int $userId, int $bookId, int $chapterNumber): void
    {
        $db = self::db();

        $existingStmt = $db->prepare('SELECT chapter_read FROM readbook WHERE id_user = :userId AND id_book = :bookId');
        $existingStmt->execute(['userId' => $userId, 'bookId' => $bookId]);
        $existing = $existingStmt->fetch();

        if ($existing === false) {
            $db->prepare('INSERT INTO readbook (read_date, chapter_read, progress_percent, id_user, id_book) VALUES (NOW(), :chapterRead, 0, :userId, :bookId)')
                ->execute(['chapterRead' => $chapterNumber, 'userId' => $userId, 'bookId' => $bookId]);
            return;
        }

        $resetProgress = (int) $existing['chapter_read'] !== $chapterNumber;
        $sql = $resetProgress
            ? 'UPDATE readbook SET chapter_read = :chapterRead, read_date = NOW(), progress_percent = 0 WHERE id_user = :userId AND id_book = :bookId'
            : 'UPDATE readbook SET chapter_read = :chapterRead, read_date = NOW() WHERE id_user = :userId AND id_book = :bookId';
        $db->prepare($sql)->execute(['chapterRead' => $chapterNumber, 'userId' => $userId, 'bookId' => $bookId]);
    }

    // Utilisé par le lecteur mobile pour enregistrer la position en cours de
    // lecture sans réémettre tout le contenu du chapitre. Réapplique le même
    // contrôle d'accès que getChapterForViewer : la progression ne doit
    // jamais fuiter/valider un chapitre non autorisé.
    /** @param array{id:int,role:string} $viewer */
    public static function setReadingProgress(int $bookId, int $chapterNumber, float $progressPercent, array $viewer): void
    {
        $stmt = self::db()->prepare(
            'SELECT ch.id_chapter, ch.chapter_title, ch.content, ch.chapter_number, ch.id_book, ch.part_id,
                    b.title AS book_title, b.id_author AS book_author_id, b.is_free AS book_is_free, b.free_chapter_count AS book_free_chapter_count,
                    bp.id_book_part AS part_row_id, bp.title AS part_title, bp.part_number AS part_number,
                    bp.is_free AS part_is_free, bp.free_chapter_count AS part_free_chapter_count, bp.price AS part_price
             FROM chapters ch
             JOIN books b ON b.id_book = ch.id_book
             LEFT JOIN book_parts bp ON bp.id_book_part = ch.part_id
             WHERE ch.id_book = :bookId AND ch.chapter_number = :chapterNumber',
        );
        $stmt->execute(['bookId' => $bookId, 'chapterNumber' => $chapterNumber]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Chapitre introuvable');
        }

        $chapter = self::mapFullChapter($row);
        self::assertChapterAccess($chapter, $viewer);

        $db = self::db();
        $db->prepare(
            'INSERT INTO readbook (read_date, chapter_read, progress_percent, id_user, id_book)
             VALUES (NOW(), :chapterRead, :progress, :userId, :bookId)
             ON DUPLICATE KEY UPDATE chapter_read = VALUES(chapter_read), progress_percent = VALUES(progress_percent), read_date = NOW()',
        )->execute(['chapterRead' => $chapterNumber, 'progress' => $progressPercent, 'userId' => $viewer['id'], 'bookId' => $bookId]);
    }

    public static function getReadingProgress(int $bookId, int $userId): ?array
    {
        $stmt = self::db()->prepare('SELECT chapter_read, progress_percent, read_date FROM readbook WHERE id_user = :userId AND id_book = :bookId');
        $stmt->execute(['userId' => $userId, 'bookId' => $bookId]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }

        return [
            'chapterRead' => (int) $row['chapter_read'],
            'progressPercent' => (float) $row['progress_percent'],
            'readAt' => $row['read_date'],
        ];
    }

    /** @param array{id:int,role:string}|null $viewer */
    public static function getChapterForViewer(int $id, ?array $viewer): array
    {
        $chapter = self::getChapterById($id);
        self::assertChapterAccess($chapter, $viewer);

        if ($viewer !== null) {
            self::recordReadingProgress($viewer['id'], $chapter['book']['id'], $chapter['chapterNumber']);
        }

        $chapter['content'] = ChapterContentEncryption::decrypt($chapter['content']);
        return $chapter;
    }

    /** @param array<string,mixed> $actingUser */
    public static function createChapter(array $input, array $actingUser): array
    {
        $book = self::getBookOrThrow($input['bookId']);
        Ownership::assertAuthorOwnership($actingUser, $book['authorId']);
        self::assertPartBelongsToBook($input['partId'], $input['bookId']);

        $db = self::db();
        $db->beginTransaction();
        try {
            $insert = $db->prepare(
                'INSERT INTO chapters (chapter_title, content, chapter_number, id_book, part_id)
                 VALUES (:title, :content, :chapterNumber, :bookId, :partId)',
            );
            try {
                $insert->execute([
                    'title' => $input['title'],
                    'content' => ChapterContentEncryption::encrypt($input['content']),
                    'chapterNumber' => $input['chapterNumber'],
                    'bookId' => $input['bookId'],
                    'partId' => $input['partId'],
                ]);
            } catch (\PDOException $e) {
                throw self::mapDuplicateChapterNumber($e);
            }
            $chapterId = (int) $db->lastInsertId();

            if ($input['extension'] !== null) {
                self::upsertExtension($chapterId, $input['extension']);
            }

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        return self::getChapterForManage($chapterId, $actingUser);
    }

    /** @param array<string,mixed> $actingUser */
    public static function updateChapter(int $id, array $input, array $actingUser): array
    {
        $chapter = self::getChapterById($id);
        Ownership::assertAuthorOwnership($actingUser, $chapter['book']['authorId']);
        if (array_key_exists('partId', $input)) {
            self::assertPartBelongsToBook($input['partId'], $chapter['book']['id']);
        }

        $columnMap = ['partId' => 'part_id', 'title' => 'chapter_title', 'chapterNumber' => 'chapter_number'];
        $set = [];
        $params = ['id' => $id];
        foreach ($columnMap as $field => $column) {
            if (!array_key_exists($field, $input)) {
                continue;
            }
            $set[] = "{$column} = :{$column}";
            $params[$column] = $input[$field];
        }
        if (array_key_exists('content', $input)) {
            $set[] = 'content = :content';
            $params['content'] = ChapterContentEncryption::encrypt($input['content']);
        }

        $db = self::db();
        $db->beginTransaction();
        try {
            if ($set !== []) {
                try {
                    $db->prepare('UPDATE chapters SET ' . implode(', ', $set) . ' WHERE id_chapter = :id')->execute($params);
                } catch (\PDOException $e) {
                    throw self::mapDuplicateChapterNumber($e);
                }
            }
            if (array_key_exists('extension', $input) && $input['extension'] !== null) {
                self::upsertExtension($id, $input['extension']);
            }
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        return self::getChapterForManage($id, $actingUser);
    }

    private static function mapDuplicateChapterNumber(\PDOException $e): Throwable
    {
        if ((int) $e->getCode() === 23000) {
            return ApiError::conflict('Ce numéro de chapitre existe déjà pour ce livre');
        }
        return $e;
    }

    /** @param array<string,mixed> $actingUser */
    public static function deleteChapter(int $id, array $actingUser): void
    {
        $chapter = self::getChapterById($id);
        Ownership::assertAuthorOwnership($actingUser, $chapter['book']['authorId']);

        self::db()->prepare('DELETE FROM chapters WHERE id_chapter = :id')->execute(['id' => $id]);
    }

    /** @param array{introduction:?string} $extension */
    private static function upsertExtension(int $chapterId, array $extension): void
    {
        self::db()->prepare(
            'INSERT INTO chapters_extension (chapter_id, introduction, created_at)
             VALUES (:chapterId, :introduction, NOW())
             ON DUPLICATE KEY UPDATE introduction = VALUES(introduction), modified_at = NOW()',
        )->execute(['chapterId' => $chapterId, 'introduction' => $extension['introduction']]);
    }

    private static function mapChapterSummary(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'chapterNumber' => (int) $row['chapterNumber'],
            'partId' => $row['partId'] !== null ? (int) $row['partId'] : null,
        ];
    }

    private static function mapFullChapter(array $row): array
    {
        $partId = $row['part_id'] !== null ? (int) $row['part_id'] : null;
        $chapterId = (int) $row['id_chapter'];

        $extStmt = self::db()->prepare('SELECT introduction FROM chapters_extension WHERE chapter_id = :id');
        $extStmt->execute(['id' => $chapterId]);
        $extRow = $extStmt->fetch();

        return [
            'id' => $chapterId,
            'title' => $row['chapter_title'],
            'content' => $row['content'],
            'chapterNumber' => (int) $row['chapter_number'],
            'bookId' => (int) $row['id_book'],
            'partId' => $partId,
            'extension' => $extRow === false ? null : ['introduction' => $extRow['introduction']],
            'part' => $partId === null ? null : [
                'id' => (int) $row['part_row_id'],
                'title' => $row['part_title'],
                'partNumber' => (int) $row['part_number'],
                'isFree' => (bool) $row['part_is_free'],
                'freeChapterCount' => (int) $row['part_free_chapter_count'],
                'price' => (int) $row['part_price'],
            ],
            'book' => [
                'id' => (int) $row['id_book'],
                'title' => $row['book_title'],
                'authorId' => (int) $row['book_author_id'],
                'isFree' => (bool) $row['book_is_free'],
                'freeChapterCount' => (int) $row['book_free_chapter_count'],
            ],
        ];
    }
}
