<?php

declare(strict_types=1);

namespace App\Modules\Achats;

use App\Lib\Database;
use PDO;

/**
 * Équivalent de la partie déjà spécifiée (mais jamais écrite) de
 * src/modules/achats/achats.routes.ts : "GET / historique d'achats de
 * l'utilisateur connecté". Le reste du TODO Node (POST /checkout, POST
 * /capture/:orderId — intégration PayPal) n'a pas de route même côté Node ;
 * ce scaffold ne l'invente pas, cf. README.
 */
final class AchatsService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    public static function listUserAchats(int $userId): array
    {
        $stmt = self::db()->prepare(
            'SELECT a.id_achat, a.date_achat, a.price, a.is_free, a.payment_method, a.part_id,
                    b.id_book, b.title AS book_title, b.slug AS book_slug, b.cover AS book_cover,
                    bp.title AS part_title, bp.part_number
             FROM achat a
             JOIN books b ON b.id_book = a.id_book
             LEFT JOIN book_parts bp ON bp.id_book_part = a.part_id
             WHERE a.id_user = :userId
             ORDER BY a.date_achat DESC',
        );
        $stmt->execute(['userId' => $userId]);

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id_achat'],
            'date' => $row['date_achat'],
            'price' => (int) $row['price'],
            'isFree' => (bool) $row['is_free'],
            'paymentMethod' => $row['payment_method'],
            'book' => [
                'id' => (int) $row['id_book'],
                'title' => $row['book_title'],
                'slug' => $row['book_slug'],
                'cover' => $row['book_cover'],
            ],
            'part' => $row['part_id'] !== null ? [
                'id' => (int) $row['part_id'],
                'title' => $row['part_title'],
                'partNumber' => (int) $row['part_number'],
            ] : null,
        ], $stmt->fetchAll());
    }
}
