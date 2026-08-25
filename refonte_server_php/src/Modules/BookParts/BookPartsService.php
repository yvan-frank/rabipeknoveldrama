<?php

declare(strict_types=1);

namespace App\Modules\BookParts;

use App\Lib\Database;
use App\Utils\ApiError;
use App\Utils\Ownership;
use PDO;

/**
 * Équivalent de src/modules/book-parts/book-parts.service.ts.
 */
final class BookPartsService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    public static function listBookParts(int $bookId): array
    {
        $stmt = self::db()->prepare(
            'SELECT id_book_part AS id, title, part_number, description, price, is_free, free_chapter_count
             FROM book_parts WHERE book_id = :bookId ORDER BY part_number ASC',
        );
        $stmt->execute(['bookId' => $bookId]);

        return array_map(self::mapPart(...), $stmt->fetchAll());
    }

    /** @return array{id:int,authorId:int} */
    private static function getPartWithBook(int $id): array
    {
        $stmt = self::db()->prepare(
            'SELECT bp.book_id, b.id_author FROM book_parts bp JOIN books b ON b.id_book = bp.book_id WHERE bp.id_book_part = :id',
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Partie introuvable');
        }
        return ['bookId' => (int) $row['book_id'], 'authorId' => (int) $row['id_author']];
    }

    /** @param array<string,mixed> $actingUser */
    public static function createBookPart(array $input, array $actingUser): array
    {
        $db = self::db();
        $bookStmt = $db->prepare('SELECT id_author FROM books WHERE id_book = :id');
        $bookStmt->execute(['id' => $input['bookId']]);
        $authorId = $bookStmt->fetchColumn();
        if ($authorId === false) {
            throw ApiError::notFound('Livre introuvable');
        }
        Ownership::assertAuthorOwnership($actingUser, (int) $authorId);

        try {
            $insert = $db->prepare(
                'INSERT INTO book_parts (book_id, title, part_number, description, price, is_free, free_chapter_count, created_at, updated_at)
                 VALUES (:bookId, :title, :partNumber, :description, :price, :isFree, :freeChapterCount, NOW(), NOW())',
            );
            $insert->execute([
                'bookId' => $input['bookId'],
                'title' => $input['title'],
                'partNumber' => $input['partNumber'],
                'description' => $input['description'],
                'price' => $input['price'],
                'isFree' => $input['isFree'] ? 1 : 0,
                'freeChapterCount' => $input['freeChapterCount'],
            ]);
        } catch (\PDOException $e) {
            throw self::mapDuplicatePartNumber($e);
        }

        return self::getPartById((int) $db->lastInsertId());
    }

    /** @param array<string,mixed> $actingUser */
    public static function updateBookPart(int $id, array $input, array $actingUser): array
    {
        $part = self::getPartWithBook($id);
        Ownership::assertAuthorOwnership($actingUser, $part['authorId']);

        $columnMap = [
            'title' => 'title', 'partNumber' => 'part_number', 'description' => 'description',
            'price' => 'price', 'isFree' => 'is_free', 'freeChapterCount' => 'free_chapter_count',
        ];

        $set = ['updated_at = NOW()'];
        $params = ['id' => $id];
        foreach ($columnMap as $field => $column) {
            if (!array_key_exists($field, $input)) {
                continue;
            }
            $value = $input[$field];
            $set[] = "{$column} = :{$column}";
            $params[$column] = is_bool($value) ? (int) $value : $value;
        }

        if (count($set) > 1) {
            try {
                self::db()->prepare('UPDATE book_parts SET ' . implode(', ', $set) . ' WHERE id_book_part = :id')->execute($params);
            } catch (\PDOException $e) {
                throw self::mapDuplicatePartNumber($e);
            }
        }

        return self::getPartById($id);
    }

    /** @param array<string,mixed> $actingUser */
    public static function deleteBookPart(int $id, array $actingUser): void
    {
        $part = self::getPartWithBook($id);
        Ownership::assertAuthorOwnership($actingUser, $part['authorId']);

        try {
            self::db()->prepare('DELETE FROM book_parts WHERE id_book_part = :id')->execute(['id' => $id]);
        } catch (\PDOException $e) {
            // FK onDelete: Restrict sur `achat` — une partie déjà achetée ne
            // doit pas pouvoir être supprimée.
            if ((int) $e->getCode() === 23000) {
                throw ApiError::conflict('Impossible de supprimer une partie déjà achetée');
            }
            throw $e;
        }
    }

    private static function mapDuplicatePartNumber(\PDOException $e): \Throwable
    {
        if ((int) $e->getCode() === 23000) {
            return ApiError::conflict('Ce numéro de partie existe déjà pour ce livre');
        }
        return $e;
    }

    private static function getPartById(int $id): array
    {
        $stmt = self::db()->prepare(
            'SELECT id_book_part AS id, title, part_number, description, price, is_free, free_chapter_count
             FROM book_parts WHERE id_book_part = :id',
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Partie introuvable');
        }
        return self::mapPart($row);
    }

    private static function mapPart(array $row): array
    {
        $partId = (int) $row['id'];

        $chaptersStmt = self::db()->prepare(
            'SELECT id_chapter AS id, chapter_title AS title, chapter_number AS chapterNumber, part_id AS partId
             FROM chapters WHERE part_id = :partId ORDER BY chapter_number ASC',
        );
        $chaptersStmt->execute(['partId' => $partId]);

        return [
            'id' => $partId,
            'title' => $row['title'],
            'partNumber' => (int) $row['part_number'],
            'description' => $row['description'],
            'price' => (int) $row['price'],
            'isFree' => (bool) $row['is_free'],
            'freeChapterCount' => (int) $row['free_chapter_count'],
            'chapters' => array_map(static fn (array $c): array => [
                'id' => (int) $c['id'],
                'title' => $c['title'],
                'chapterNumber' => (int) $c['chapterNumber'],
                'partId' => $c['partId'] !== null ? (int) $c['partId'] : null,
            ], $chaptersStmt->fetchAll()),
        ];
    }
}
