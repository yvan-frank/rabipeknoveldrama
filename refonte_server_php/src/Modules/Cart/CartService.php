<?php

declare(strict_types=1);

namespace App\Modules\Cart;

use App\Lib\Database;
use App\Utils\ApiError;
use PDO;

/**
 * Équivalent de src/modules/cart/cart.service.ts. Toutes les méthodes
 * opèrent toujours sur le panier de l'utilisateur connecté (jamais un id_user
 * passé en paramètre), comme côté Node.
 */
final class CartService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    public static function listCart(int $userId): array
    {
        $stmt = self::db()->prepare(
            'SELECT c.id_cart, c.qty, c.created, c.part_id,
                    bp.title AS part_title, bp.part_number, bp.price AS part_price, bp.is_free AS part_is_free,
                    b.id_book AS book_id, b.title AS book_title, b.slug AS book_slug, b.cover AS book_cover
             FROM cart c
             JOIN book_parts bp ON bp.id_book_part = c.part_id
             JOIN books b ON b.id_book = bp.book_id
             WHERE c.id_user = :userId AND c.part_id IS NOT NULL
             ORDER BY c.created DESC',
        );
        $stmt->execute(['userId' => $userId]);

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id_cart'],
            'quantity' => $row['qty'] !== null ? (int) $row['qty'] : null,
            'createdAt' => $row['created'],
            'partId' => (int) $row['part_id'],
            'part' => [
                'id' => (int) $row['part_id'],
                'title' => $row['part_title'],
                'partNumber' => (int) $row['part_number'],
                'price' => (int) $row['part_price'],
                'isFree' => (bool) $row['part_is_free'],
                'book' => [
                    'id' => (int) $row['book_id'],
                    'title' => $row['book_title'],
                    'slug' => $row['book_slug'],
                    'cover' => $row['book_cover'],
                ],
            ],
        ], $stmt->fetchAll());
    }

    public static function addPartToCart(int $userId, int $partId): array
    {
        $db = self::db();

        $partStmt = $db->prepare('SELECT id_book_part, book_id, is_free FROM book_parts WHERE id_book_part = :id');
        $partStmt->execute(['id' => $partId]);
        $part = $partStmt->fetch();
        if ($part === false) {
            throw ApiError::notFound('Partie introuvable');
        }
        if ((bool) $part['is_free']) {
            throw ApiError::badRequest('Cette partie est déjà gratuite');
        }

        $purchaseStmt = $db->prepare('SELECT id_achat FROM achat WHERE id_user = :userId AND part_id = :partId LIMIT 1');
        $purchaseStmt->execute(['userId' => $userId, 'partId' => $partId]);
        if ($purchaseStmt->fetchColumn() !== false) {
            throw ApiError::conflict('Vous possédez déjà cette partie');
        }

        $existingStmt = $db->prepare('SELECT id_cart FROM cart WHERE id_user = :userId AND part_id = :partId LIMIT 1');
        $existingStmt->execute(['userId' => $userId, 'partId' => $partId]);
        $existingId = $existingStmt->fetchColumn();
        if ($existingId !== false) {
            return ['id' => (int) $existingId];
        }

        $insert = $db->prepare(
            'INSERT INTO cart (qty, id_book, part_id, id_user, created) VALUES (1, :bookId, :partId, :userId, NOW())',
        );
        $insert->execute(['bookId' => $part['book_id'], 'partId' => $partId, 'userId' => $userId]);

        return ['id' => (int) $db->lastInsertId()];
    }

    public static function removePartFromCart(int $userId, int $partId): void
    {
        self::db()->prepare('DELETE FROM cart WHERE id_user = :userId AND part_id = :partId')
            ->execute(['userId' => $userId, 'partId' => $partId]);
    }
}
