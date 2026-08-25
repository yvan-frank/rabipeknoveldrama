<?php

declare(strict_types=1);

namespace App\Modules\Likes;

use App\Lib\Database;
use App\Utils\ApiError;
use PDO;

/**
 * Équivalent de src/modules/likes/likes.service.ts.
 */
final class LikesService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    /** @return array{liked:bool,likeCount:int} */
    public static function toggleBookLike(int $bookId, int $userId): array
    {
        $db = self::db();

        $bookStmt = $db->prepare('SELECT id_book FROM books WHERE id_book = :id');
        $bookStmt->execute(['id' => $bookId]);
        if ($bookStmt->fetchColumn() === false) {
            throw ApiError::notFound('Livre introuvable');
        }

        $existingStmt = $db->prepare('SELECT id_like FROM likes WHERE id_book = :bookId AND id_user = :userId');
        $existingStmt->execute(['bookId' => $bookId, 'userId' => $userId]);
        $existingId = $existingStmt->fetchColumn();

        if ($existingId !== false) {
            $db->prepare('DELETE FROM likes WHERE id_like = :id')->execute(['id' => $existingId]);
        } else {
            $db->prepare('INSERT INTO likes (date_like, id_book, id_user) VALUES (NOW(), :bookId, :userId)')
                ->execute(['bookId' => $bookId, 'userId' => $userId]);
        }

        $countStmt = $db->prepare('SELECT COUNT(*) FROM likes WHERE id_book = :bookId');
        $countStmt->execute(['bookId' => $bookId]);

        return ['liked' => $existingId === false, 'likeCount' => (int) $countStmt->fetchColumn()];
    }
}
