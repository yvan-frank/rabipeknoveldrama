<?php

declare(strict_types=1);

namespace App\Modules\Comments;

use App\Lib\Database;
use App\Utils\ApiError;
use App\Utils\Ownership;
use PDO;

/**
 * Équivalent de src/modules/comments/comments.service.ts.
 */
final class CommentsService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    // "Avis" = un commentaire sur un livre (table `commentaires`, contrainte
    // unique id_book+id_user) : un seul avis par utilisateur et par livre —
    // un second envoi met à jour l'avis existant plutôt que d'en créer un doublon.
    public static function listBookReviews(int $bookId): array
    {
        $db = self::db();
        $stmt = $db->prepare(
            'SELECT c.id_comment AS id, c.message, c.rating, c.created_at, u.id_user AS user_id, u.name AS user_name
             FROM commentaires c
             JOIN users u ON u.id_user = c.id_user
             WHERE c.id_book = :bookId
             ORDER BY c.created_at DESC',
        );
        $stmt->execute(['bookId' => $bookId]);
        $rows = $stmt->fetchAll();

        if ($rows === []) {
            return [];
        }

        $ids = array_map(static fn (array $r): int => (int) $r['id'], $rows);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $repliesStmt = $db->prepare(
            "SELECT id, comment_id, content, created_at FROM book_review_replies WHERE comment_id IN ({$placeholders})",
        );
        $repliesStmt->execute($ids);
        $repliesByComment = [];
        foreach ($repliesStmt->fetchAll() as $reply) {
            $repliesByComment[(int) $reply['comment_id']][] = [
                'id' => (int) $reply['id'],
                'content' => $reply['content'],
                'createdAt' => $reply['created_at'],
            ];
        }

        return array_map(static function (array $row) use ($repliesByComment): array {
            $id = (int) $row['id'];
            return [
                'id' => $id,
                'message' => $row['message'],
                'rating' => (int) $row['rating'],
                'createdAt' => $row['created_at'],
                'user' => ['id' => (int) $row['user_id'], 'name' => $row['user_name']],
                'replies' => $repliesByComment[$id] ?? [],
            ];
        }, $rows);
    }

    /** @param array<string,mixed> $responder */
    public static function replyToBookReview(int $commentId, string $content, array $responder): array
    {
        $db = self::db();
        $stmt = $db->prepare('SELECT c.id_comment, b.id_author FROM commentaires c JOIN books b ON b.id_book = c.id_book WHERE c.id_comment = :id');
        $stmt->execute(['id' => $commentId]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Avis introuvable');
        }
        Ownership::assertAuthorOwnership($responder, (int) $row['id_author']);

        $db->prepare(
            'INSERT INTO book_review_replies (comment_id, responder_id, content, created_at, updated_at)
             VALUES (:commentId, :responderId, :content, NOW(), NOW())
             ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW()',
        )->execute(['commentId' => $commentId, 'responderId' => $responder['id'], 'content' => $content]);

        $select = $db->prepare('SELECT id, content, created_at FROM book_review_replies WHERE comment_id = :commentId');
        $select->execute(['commentId' => $commentId]);
        $reply = $select->fetch();

        return ['id' => (int) $reply['id'], 'content' => $reply['content'], 'createdAt' => $reply['created_at']];
    }

    /** @return array{reviewCount:int,averageRating:float} */
    public static function getBookReviewStats(int $bookId): array
    {
        $stmt = self::db()->prepare('SELECT COUNT(*) AS review_count, AVG(rating) AS average_rating FROM commentaires WHERE id_book = :id');
        $stmt->execute(['id' => $bookId]);
        $row = $stmt->fetch();

        return [
            'reviewCount' => (int) $row['review_count'],
            'averageRating' => $row['average_rating'] !== null ? (float) $row['average_rating'] : 0.0,
        ];
    }

    /** @param array{message:string,rating:int} $input */
    public static function upsertBookReview(int $bookId, int $userId, array $input): array
    {
        $db = self::db();
        $bookStmt = $db->prepare('SELECT id_book FROM books WHERE id_book = :id');
        $bookStmt->execute(['id' => $bookId]);
        if ($bookStmt->fetchColumn() === false) {
            throw ApiError::notFound('Livre introuvable');
        }

        $db->prepare(
            'INSERT INTO commentaires (message, rating, id_book, id_user, created_at)
             VALUES (:message, :rating, :bookId, :userId, NOW())
             ON DUPLICATE KEY UPDATE message = VALUES(message), rating = VALUES(rating)',
        )->execute(['message' => $input['message'], 'rating' => $input['rating'], 'bookId' => $bookId, 'userId' => $userId]);

        $select = $db->prepare(
            'SELECT c.id_comment AS id, c.message, c.rating, c.created_at, u.id_user AS user_id, u.name AS user_name
             FROM commentaires c JOIN users u ON u.id_user = c.id_user
             WHERE c.id_book = :bookId AND c.id_user = :userId',
        );
        $select->execute(['bookId' => $bookId, 'userId' => $userId]);
        $row = $select->fetch();

        return [
            'id' => (int) $row['id'],
            'message' => $row['message'],
            'rating' => (int) $row['rating'],
            'createdAt' => $row['created_at'],
            'user' => ['id' => (int) $row['user_id'], 'name' => $row['user_name']],
        ];
    }

    // Fil de discussion par chapitre — liste à plat (triée chronologiquement),
    // le regroupement commentaire/réponses via parentId se fait côté frontend.
    public static function listChapterComments(int $chapterId): array
    {
        $stmt = self::db()->prepare(
            'SELECT cc.id, cc.content, cc.parent_id, cc.created_at, u.id_user AS user_id, u.name AS user_name
             FROM comments_chapter cc
             JOIN users u ON u.id_user = cc.user_id
             WHERE cc.chapter_id = :chapterId
             ORDER BY cc.created_at ASC',
        );
        $stmt->execute(['chapterId' => $chapterId]);

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'content' => $row['content'],
            'parentId' => $row['parent_id'] !== null ? (int) $row['parent_id'] : null,
            'createdAt' => $row['created_at'],
            'user' => ['id' => (int) $row['user_id'], 'name' => $row['user_name']],
        ], $stmt->fetchAll());
    }

    /** @param array{content:string,parentId:?int} $input */
    public static function createChapterComment(int $chapterId, int $userId, array $input): array
    {
        $db = self::db();
        $chapterStmt = $db->prepare('SELECT id_chapter FROM chapters WHERE id_chapter = :id');
        $chapterStmt->execute(['id' => $chapterId]);
        if ($chapterStmt->fetchColumn() === false) {
            throw ApiError::notFound('Chapitre introuvable');
        }

        if ($input['parentId'] !== null) {
            $parentStmt = $db->prepare('SELECT chapter_id FROM comments_chapter WHERE id = :id');
            $parentStmt->execute(['id' => $input['parentId']]);
            $parentChapterId = $parentStmt->fetchColumn();
            if ($parentChapterId === false || (int) $parentChapterId !== $chapterId) {
                throw ApiError::badRequest('Commentaire parent introuvable pour ce chapitre');
            }
        }

        $insert = $db->prepare(
            'INSERT INTO comments_chapter (chapter_id, user_id, parent_id, content, created_at, updated_at)
             VALUES (:chapterId, :userId, :parentId, :content, NOW(), NOW())',
        );
        $insert->execute([
            'chapterId' => $chapterId,
            'userId' => $userId,
            'parentId' => $input['parentId'],
            'content' => $input['content'],
        ]);
        $id = (int) $db->lastInsertId();

        $select = $db->prepare(
            'SELECT cc.id, cc.content, cc.parent_id, cc.created_at, u.id_user AS user_id, u.name AS user_name
             FROM comments_chapter cc JOIN users u ON u.id_user = cc.user_id WHERE cc.id = :id',
        );
        $select->execute(['id' => $id]);
        $row = $select->fetch();

        return [
            'id' => (int) $row['id'],
            'content' => $row['content'],
            'parentId' => $row['parent_id'] !== null ? (int) $row['parent_id'] : null,
            'createdAt' => $row['created_at'],
            'user' => ['id' => (int) $row['user_id'], 'name' => $row['user_name']],
        ];
    }

    // Seul l'auteur du commentaire peut le supprimer (pas de modération
    // auteur/admin ici, contrairement aux avis livre). ON DELETE CASCADE sur
    // comments_chapter.parent_id (cf. schema.prisma) supprime automatiquement
    // les réponses du fil avec leur parent.
    public static function deleteChapterComment(int $commentId, int $userId): void
    {
        $db = self::db();
        $stmt = $db->prepare('SELECT user_id FROM comments_chapter WHERE id = :id');
        $stmt->execute(['id' => $commentId]);
        $ownerId = $stmt->fetchColumn();
        if ($ownerId === false) {
            throw ApiError::notFound('Commentaire introuvable');
        }
        if ((int) $ownerId !== $userId) {
            throw ApiError::forbidden('Vous ne pouvez supprimer que vos propres commentaires');
        }

        $db->prepare('DELETE FROM comments_chapter WHERE id = :id')->execute(['id' => $commentId]);
    }
}
