<?php

declare(strict_types=1);

namespace App\Modules\Users;

use App\Lib\Database;
use App\Utils\ApiError;
use PDO;
use Throwable;

/**
 * Équivalent de src/modules/users/users.service.ts.
 */
final class UsersService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    // Sélection explicite des colonnes exposées : jamais `password` côté API.
    private const PUBLIC_USER_SELECT = 'id_user AS id, name, email, is_admin, is_active, created_at';

    public static function listUsers(int $page, int $pageSize): array
    {
        $db = self::db();

        $stmt = $db->prepare(
            'SELECT ' . self::PUBLIC_USER_SELECT . ' FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT :limit OFFSET :offset',
        );
        $stmt->bindValue('limit', $pageSize, PDO::PARAM_INT);
        $stmt->bindValue('offset', ($page - 1) * $pageSize, PDO::PARAM_INT);
        $stmt->execute();
        $items = array_map(self::mapPublicUser(...), $stmt->fetchAll());

        $countStmt = $db->query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');

        return ['items' => $items, 'total' => (int) $countStmt->fetchColumn(), 'page' => $page, 'pageSize' => $pageSize];
    }

    public static function getUserById(int $id): array
    {
        $stmt = self::db()->prepare('SELECT ' . self::PUBLIC_USER_SELECT . ' FROM users WHERE id_user = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Utilisateur introuvable');
        }
        return self::mapPublicUser($row);
    }

    public static function softDeleteUser(int $id): void
    {
        self::getUserById($id);
        self::db()->prepare('UPDATE users SET deleted_at = NOW() WHERE id_user = :id')->execute(['id' => $id]);
    }

    // Promotion admin lecteur -> auteur. `users` et `author` sont deux tables
    // indépendantes (pas un simple rôle) : "promouvoir" crée donc un vrai
    // compte auteur, en réutilisant tel quel le hash bcrypt existant (déjà
    // auto-descriptif — coût/sel inclus dans la chaîne — donc vérifiable sans
    // le reconnaître) pour que le même mot de passe continue de fonctionner.
    // Le compte lecteur est désactivé (soft-delete, réversible) dans la
    // foulée : sinon AuthService::login() — qui interroge `users` avant
    // `author` — retomberait toujours sur l'ancien compte lecteur et le
    // nouveau compte auteur ne serait jamais atteignable avec cet email.
    public static function promoteToAuthor(int $id): array
    {
        $db = self::db();

        $stmt = $db->prepare('SELECT id_user, name, email, password FROM users WHERE id_user = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();
        if ($user === false) {
            throw ApiError::notFound('Utilisateur introuvable');
        }

        $existingAuthor = $db->prepare('SELECT id_author FROM author WHERE email = :email');
        $existingAuthor->execute(['email' => $user['email']]);
        if ($existingAuthor->fetch() !== false) {
            throw ApiError::conflict('Un compte auteur existe déjà avec cet email');
        }

        $db->beginTransaction();
        try {
            $insert = $db->prepare(
                'INSERT INTO author (name, email, password, is_email_verified, is_account_verified, created_at)
                 VALUES (:name, :email, :password, 1, 1, NOW())',
            );
            $insert->execute(['name' => $user['name'], 'email' => $user['email'], 'password' => $user['password']]);
            $authorId = (int) $db->lastInsertId();

            $db->prepare('UPDATE users SET deleted_at = NOW() WHERE id_user = :id')->execute(['id' => $id]);

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        return ['id' => $authorId, 'name' => $user['name'], 'email' => $user['email']];
    }

    // Coût identique à AuthService::SALT_COST (bcrypt) — même politique de
    // hachage, que le mot de passe soit défini à l'inscription ou réinitialisé
    // par un administrateur.
    private const PASSWORD_SALT_COST = 12;

    // Édition admin : nom/email/statut actif/statut admin/mot de passe.
    // L'email est contraint UNIQUE en base — un doublon remonte en 409
    // plutôt qu'en 500.
    /** @param array{name?:string,email?:string,isActive?:bool,isAdmin?:bool,password?:string} $input */
    public static function updateUser(int $id, array $input): array
    {
        self::getUserById($id);
        if ($input === []) {
            return self::getUserById($id);
        }

        $columns = ['name' => 'name', 'email' => 'email', 'isActive' => 'is_active', 'isAdmin' => 'is_admin'];
        $sets = [];
        $params = ['id' => $id];
        foreach ($columns as $key => $column) {
            if (array_key_exists($key, $input)) {
                $sets[] = "{$column} = :{$key}";
                $params[$key] = is_bool($input[$key]) ? ($input[$key] ? 1 : 0) : $input[$key];
            }
        }

        if (array_key_exists('password', $input)) {
            $sets[] = 'password = :password';
            $params['password'] = password_hash($input['password'], PASSWORD_BCRYPT, ['cost' => self::PASSWORD_SALT_COST]);
        }

        try {
            self::db()
                ->prepare('UPDATE users SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id_user = :id')
                ->execute($params);
        } catch (Throwable $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                throw ApiError::conflict('Cette adresse e-mail est déjà utilisée');
            }
            throw $e;
        }

        return self::getUserById($id);
    }

    // Attribution manuelle temporaire, avant l'intégration des moyens de
    // paiement. Un Achat de livre (part_id = null) est déjà la source de
    // vérité des droits de lecture : ce format donne donc accès à toutes les
    // parties sans contourner le paywall ni ajouter une seconde logique
    // d'autorisation. Utilisée aussi bien par l'espace admin (paymentMethod
    // par défaut 'admin-grant') que par BooksService::grantBookToReader
    // (paymentMethod 'author-grant'), exactement comme côté Node où
    // books.service.ts importe cette même fonction depuis users.service.ts.
    /** @param array{bookId:int,note:?string} $input */
    public static function grantBookToUser(int $userId, array $input, int $grantedByUserId, string $paymentMethod = 'admin-grant'): array
    {
        $db = self::db();

        $userStmt = $db->prepare('SELECT id_user, name, email FROM users WHERE id_user = :id AND deleted_at IS NULL');
        $userStmt->execute(['id' => $userId]);
        $user = $userStmt->fetch();
        if ($user === false) {
            throw ApiError::notFound('Utilisateur introuvable');
        }

        $bookStmt = $db->prepare('SELECT id_book, title, slug FROM books WHERE id_book = :id');
        $bookStmt->execute(['id' => $input['bookId']]);
        $book = $bookStmt->fetch();
        if ($book === false) {
            throw ApiError::notFound('Livre introuvable');
        }
        $bookId = (int) $book['id_book'];

        $existingStmt = $db->prepare('SELECT id_achat FROM achat WHERE id_user = :userId AND id_book = :bookId AND part_id IS NULL');
        $existingStmt->execute(['userId' => $userId, 'bookId' => $bookId]);
        if ($existingStmt->fetchColumn() !== false) {
            throw ApiError::conflict('Cet utilisateur possède déjà ce livre');
        }

        $metadata = ['source' => $paymentMethod, 'grantedByUserId' => $grantedByUserId];
        if ($input['note'] !== null) {
            $metadata['note'] = $input['note'];
        }

        $db->beginTransaction();
        try {
            $insert = $db->prepare(
                'INSERT INTO achat (date_achat, price, is_free, id_user, id_book, payment_method, metadata)
                 VALUES (NOW(), 0, 1, :userId, :bookId, :paymentMethod, :metadata)',
            );
            $insert->execute([
                'userId' => $userId,
                'bookId' => $bookId,
                'paymentMethod' => $paymentMethod,
                'metadata' => json_encode($metadata, JSON_UNESCAPED_UNICODE),
            ]);
            $achatId = (int) $db->lastInsertId();

            // Le panier n'a plus lieu d'être une fois l'accès intégral accordé.
            $db->prepare('DELETE FROM cart WHERE id_user = :userId AND id_book = :bookId')
                ->execute(['userId' => $userId, 'bookId' => $bookId]);

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        $select = $db->prepare('SELECT id_achat AS id, date_achat AS date, price, payment_method AS paymentMethod FROM achat WHERE id_achat = :id');
        $select->execute(['id' => $achatId]);
        $grant = $select->fetch();

        return [
            'id' => (int) $grant['id'],
            'date' => $grant['date'],
            'price' => (int) $grant['price'],
            'paymentMethod' => $grant['paymentMethod'],
            'user' => ['id' => (int) $user['id_user'], 'name' => $user['name'], 'email' => $user['email']],
            'book' => ['id' => $bookId, 'title' => $book['title'], 'slug' => $book['slug']],
        ];
    }

    public static function getActiveUserIdByEmail(string $email): int
    {
        $stmt = self::db()->prepare('SELECT id_user FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1');
        $stmt->execute(['email' => $email]);
        $id = $stmt->fetchColumn();
        if ($id === false) {
            throw ApiError::notFound('Utilisateur introuvable');
        }
        return (int) $id;
    }

    public static function listBookGrants(int $page, int $pageSize): array
    {
        $db = self::db();

        $stmt = $db->prepare(
            "SELECT a.id_achat, a.date_achat, a.metadata,
                    u.id_user AS user_id, u.name AS user_name, u.email AS user_email,
                    b.id_book AS book_id, b.title AS book_title, b.slug AS book_slug, b.cover AS book_cover
             FROM achat a
             JOIN users u ON u.id_user = a.id_user
             JOIN books b ON b.id_book = a.id_book
             WHERE a.payment_method = 'admin-grant'
             ORDER BY a.date_achat DESC
             LIMIT :limit OFFSET :offset",
        );
        $stmt->bindValue('limit', $pageSize, PDO::PARAM_INT);
        $stmt->bindValue('offset', ($page - 1) * $pageSize, PDO::PARAM_INT);
        $stmt->execute();

        $items = array_map(static function (array $row): array {
            $metadata = $row['metadata'] !== null ? json_decode((string) $row['metadata'], true) : null;
            $note = is_array($metadata) && isset($metadata['note']) && is_string($metadata['note']) ? $metadata['note'] : null;

            return [
                'id' => (int) $row['id_achat'],
                'date' => $row['date_achat'],
                'note' => $note,
                'user' => ['id' => (int) $row['user_id'], 'name' => $row['user_name'], 'email' => $row['user_email']],
                'book' => ['id' => (int) $row['book_id'], 'title' => $row['book_title'], 'slug' => $row['book_slug'], 'cover' => $row['book_cover']],
            ];
        }, $stmt->fetchAll());

        $countStmt = $db->query("SELECT COUNT(*) FROM achat WHERE payment_method = 'admin-grant'");

        return ['items' => $items, 'total' => (int) $countStmt->fetchColumn(), 'page' => $page, 'pageSize' => $pageSize];
    }

    // Seules les attributions manuelles sont révocables ici. Un achat réel ne
    // peut jamais être supprimé par cette opération administrative.
    public static function revokeBookGrant(int $grantId): void
    {
        $stmt = self::db()->prepare("DELETE FROM achat WHERE id_achat = :id AND payment_method = 'admin-grant'");
        $stmt->execute(['id' => $grantId]);
        if ($stmt->rowCount() === 0) {
            throw ApiError::notFound('Attribution introuvable ou non révocable');
        }
    }

    public static function getUserDashboard(int $userId): array
    {
        $db = self::db();

        $cartStmt = $db->prepare(
            'SELECT c.id_cart, c.created, b.id_book, b.title, b.slug, b.cover
             FROM cart c JOIN books b ON b.id_book = c.id_book
             WHERE c.id_user = :userId ORDER BY c.created DESC',
        );
        $cartStmt->execute(['userId' => $userId]);
        $cart = array_map(static fn (array $row): array => [
            'id' => (int) $row['id_cart'],
            'createdAt' => $row['created'],
            'book' => self::mapDashboardBook($row),
        ], $cartStmt->fetchAll());

        $purchasesStmt = $db->prepare(
            'SELECT a.id_achat, a.date_achat, a.price, a.is_free, a.payment_method,
                    b.id_book, b.title, b.slug, b.cover,
                    (SELECT COUNT(*) FROM chapters ch WHERE ch.id_book = b.id_book) AS chapters_count,
                    p.id_book_part, p.title AS part_title, p.part_number
             FROM achat a
             JOIN books b ON b.id_book = a.id_book
             LEFT JOIN book_parts p ON p.id_book_part = a.part_id
             WHERE a.id_user = :userId ORDER BY a.date_achat DESC',
        );
        $purchasesStmt->execute(['userId' => $userId]);
        $purchases = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id_achat'],
                'date' => $row['date_achat'],
                'price' => (int) $row['price'],
                'isFree' => (bool) $row['is_free'],
                'paymentMethod' => $row['payment_method'],
                'book' => self::mapDashboardBook($row, true),
                'part' => $row['id_book_part'] !== null
                    ? ['id' => (int) $row['id_book_part'], 'title' => $row['part_title'], 'partNumber' => (int) $row['part_number']]
                    : null,
            ];
        }, $purchasesStmt->fetchAll());

        $readsStmt = $db->prepare(
            'SELECT r.id_read, r.read_date, r.chapter_read, r.progress_percent,
                    b.id_book, b.title, b.slug, b.cover,
                    (SELECT COUNT(*) FROM chapters ch WHERE ch.id_book = b.id_book) AS chapters_count
             FROM readbook r JOIN books b ON b.id_book = r.id_book
             WHERE r.id_user = :userId ORDER BY r.read_date DESC',
        );
        $readsStmt->execute(['userId' => $userId]);
        $allReads = array_map(static fn (array $row): array => [
            'id' => (int) $row['id_read'],
            'readAt' => $row['read_date'],
            'chapterRead' => (int) $row['chapter_read'],
            'progressPercent' => (float) $row['progress_percent'],
            'book' => self::mapDashboardBook($row, true),
        ], $readsStmt->fetchAll());

        $likedStmt = $db->prepare(
            'SELECT l.id_like, l.date_like, b.id_book, b.title, b.slug, b.cover
             FROM likes l JOIN books b ON b.id_book = l.id_book
             WHERE l.id_user = :userId ORDER BY l.date_like DESC LIMIT 6',
        );
        $likedStmt->execute(['userId' => $userId]);
        $likedBooks = array_map(static fn (array $row): array => [
            'id' => (int) $row['id_like'],
            'likedAt' => $row['date_like'],
            'book' => self::mapDashboardBook($row),
        ], $likedStmt->fetchAll());

        $counts = self::countByUser($db, $userId, [
            'cart' => 'SELECT COUNT(*) FROM cart WHERE id_user = :userId',
            'purchases' => 'SELECT COUNT(*) FROM achat WHERE id_user = :userId',
            'reads' => 'SELECT COUNT(*) FROM readbook WHERE id_user = :userId',
            'likes' => 'SELECT COUNT(*) FROM likes WHERE id_user = :userId',
            'reviews' => 'SELECT COUNT(*) FROM commentaires WHERE id_user = :userId',
            'chapterComments' => 'SELECT COUNT(*) FROM comments_chapter WHERE user_id = :userId',
            'shares' => 'SELECT COUNT(*) FROM shares WHERE id_user = :userId',
        ]);

        // "Ma bibliothèque" = tout livre acheté OU commencé (même
        // gratuit/aperçu), dédupliqué par livre, avec la progression de
        // lecture quand elle existe.
        $library = [];
        foreach ($purchases as $purchase) {
            $bookId = $purchase['book']['id'];
            $existing = $library[$bookId] ?? null;
            $library[$bookId] = [
                'id' => $bookId,
                'book' => $purchase['book'],
                'totalChapters' => $purchase['book']['chaptersCount'],
                'chapterRead' => $existing['chapterRead'] ?? null,
                'progressPercent' => $existing['progressPercent'] ?? 0,
                // Un achat historique de livre donne accès à l'ensemble. Les
                // nouveaux achats de partie restent listés précisément.
                'purchased' => $existing['purchased'] ?? ($purchase['part'] === null),
                'purchasedParts' => [...($existing['purchasedParts'] ?? []), ...($purchase['part'] !== null ? [$purchase['part']['title']] : [])],
                'lastActivityAt' => $purchase['date'],
            ];
        }
        foreach ($allReads as $read) {
            $bookId = $read['book']['id'];
            $existing = $library[$bookId] ?? null;
            $library[$bookId] = [
                'id' => $bookId,
                'book' => $read['book'],
                'totalChapters' => $read['book']['chaptersCount'],
                'chapterRead' => $read['chapterRead'],
                'progressPercent' => $read['progressPercent'],
                'purchased' => $existing['purchased'] ?? false,
                'purchasedParts' => $existing['purchasedParts'] ?? [],
                'lastActivityAt' => $read['readAt'],
            ];
        }
        $library = array_values($library);
        usort($library, static fn (array $a, array $b): int => strcmp((string) $b['lastActivityAt'], (string) $a['lastActivityAt']));

        return [
            'cart' => $cart,
            'purchases' => array_slice($purchases, 0, 6),
            'recentReads' => array_slice($allReads, 0, 4),
            'library' => $library,
            'likedBooks' => $likedBooks,
            'counts' => [
                'cart' => $counts['cart'],
                'purchases' => $counts['purchases'],
                'reads' => $counts['reads'],
                'likes' => $counts['likes'],
                'comments' => $counts['reviews'] + $counts['chapterComments'],
                'shares' => $counts['shares'],
            ],
        ];
    }

    public static function getAdminDashboard(): array
    {
        $db = self::db();

        $usersStmt = $db->query('SELECT ' . self::PUBLIC_USER_SELECT . ' FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 6');
        $recentUsers = array_map(self::mapPublicUser(...), $usersStmt->fetchAll());

        $authorsStmt = $db->query(
            'SELECT a.id_author, a.name, a.email, a.is_account_verified, a.created_at,
                    ae.kyc_verified_at
             FROM author a
             LEFT JOIN author_extension ae ON ae.author_id = a.id_author
             ORDER BY a.created_at DESC LIMIT 6',
        );
        $recentAuthors = array_map(static fn (array $row): array => [
            'id' => (int) $row['id_author'],
            'name' => $row['name'],
            'email' => $row['email'],
            'isAccountVerified' => (bool) $row['is_account_verified'],
            'isKycVerified' => $row['kyc_verified_at'] !== null,
            'createdAt' => $row['created_at'],
        ], $authorsStmt->fetchAll());

        $booksStmt = $db->query(
            'SELECT b.id_book, b.title, b.slug, b.cover, b.date_pub, b.is_free, b.price, au.name AS author_name, au.email AS author_email
             FROM books b JOIN author au ON au.id_author = b.id_author
             ORDER BY b.created_at DESC LIMIT 6',
        );
        $recentBooks = array_map(static fn (array $row): array => [
            'id' => (int) $row['id_book'],
            'title' => $row['title'],
            'slug' => $row['slug'],
            'cover' => $row['cover'],
            'datePub' => $row['date_pub'],
            'isFree' => (bool) $row['is_free'],
            'price' => (int) $row['price'],
            'author' => ['name' => $row['author_name'], 'email' => $row['author_email']],
        ], $booksStmt->fetchAll());

        $countQueries = [
            'users' => 'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL',
            'authors' => 'SELECT COUNT(*) FROM author',
            'books' => 'SELECT COUNT(*) FROM books',
            'chapters' => 'SELECT COUNT(*) FROM chapters',
            'purchases' => 'SELECT COUNT(*) FROM achat',
            'reviews' => 'SELECT COUNT(*) FROM commentaires',
            'chapterComments' => 'SELECT COUNT(*) FROM comments_chapter',
            'likes' => 'SELECT COUNT(*) FROM likes',
            'shares' => 'SELECT COUNT(*) FROM shares',
            'carts' => 'SELECT COUNT(*) FROM cart',
        ];
        $counts = [];
        foreach ($countQueries as $key => $sql) {
            $counts[$key] = (int) $db->query($sql)->fetchColumn();
        }

        $revenueStmt = $db->query('SELECT COALESCE(SUM(price), 0) FROM achat WHERE is_free = 0');
        $revenue = (int) $revenueStmt->fetchColumn();

        return [
            'recentUsers' => $recentUsers,
            'recentAuthors' => $recentAuthors,
            'recentBooks' => $recentBooks,
            'revenue' => $revenue,
            'counts' => [
                'users' => $counts['users'],
                'authors' => $counts['authors'],
                'books' => $counts['books'],
                'chapters' => $counts['chapters'],
                'purchases' => $counts['purchases'],
                'reviews' => $counts['reviews'] + $counts['chapterComments'],
                'likes' => $counts['likes'],
                'shares' => $counts['shares'],
                'carts' => $counts['carts'],
            ],
        ];
    }

    /** @param array<string,string> $queries */
    private static function countByUser(PDO $db, int $userId, array $queries): array
    {
        $counts = [];
        foreach ($queries as $key => $sql) {
            $stmt = $db->prepare($sql);
            $stmt->execute(['userId' => $userId]);
            $counts[$key] = (int) $stmt->fetchColumn();
        }
        return $counts;
    }

    private static function mapPublicUser(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'isAdmin' => (bool) $row['is_admin'],
            'isActive' => (bool) $row['is_active'],
            'createdAt' => $row['created_at'],
        ];
    }

    private static function mapDashboardBook(array $row, bool $withChapterCount = false): array
    {
        $book = [
            'id' => (int) $row['id_book'],
            'title' => $row['title'],
            'slug' => $row['slug'],
            'cover' => $row['cover'],
        ];
        if ($withChapterCount) {
            $book['chaptersCount'] = (int) $row['chapters_count'];
        }
        return $book;
    }
}
