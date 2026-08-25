<?php

declare(strict_types=1);

namespace App\Modules\Books;

use App\Lib\Database;
use App\Modules\Comments\CommentsService;
use App\Modules\Stats\ViewTrackingService;
use App\Modules\Users\UsersService;
use App\Utils\ApiError;
use App\Utils\Ownership;
use App\Utils\Slugify;
use PDO;

/**
 * Équivalent de src/modules/books/books.service.ts. Le comptage de vues, la
 * notation moyenne d'un livre et le don d'accès à un lecteur sont délégués à
 * leurs modules respectifs (Stats::ViewTrackingService,
 * Comments::CommentsService, Users::UsersService), exactement comme côté
 * Node où books.service.ts les importe depuis stats/view-tracking.service,
 * comments/comments.service et users/users.service — pas de logique
 * dupliquée ici.
 */
final class BooksService
{
    private const CATEGORY_FIELDS = 'c.id_category AS category_id, c.category_name AS category_name, c.description AS category_description';
    private const AUTHOR_FIELDS = 'au.id_author AS author_row_id, au.name AS author_name, au.designation AS author_designation, au.image AS author_image, au.cover AS author_cover, au.about AS author_about';

    private static function db(): PDO
    {
        return Database::connection();
    }

    /** @param array{page:int,pageSize:int,categoryId:?int,authorId:?int,search:?string,isFree:?bool} $query */
    public static function listBooks(array $query): array
    {
        $db = self::db();
        [$page, $pageSize] = [$query['page'], $query['pageSize']];

        [$where, $params] = self::buildListWhere($query);

        $stmt = $db->prepare(
            "SELECT b.id_book AS id, b.slug, b.title, b.cover, b.price, b.is_free, b.is_promotion,
                    b.promotion_price, b.is_adult_only, b.date_pub, " . self::CATEGORY_FIELDS . ', ' . self::AUTHOR_FIELDS . "
             FROM books b
             JOIN category c ON c.id_category = b.id_category
             JOIN author au ON au.id_author = b.id_author
             WHERE {$where}
             ORDER BY b.created_at DESC
             LIMIT :limit OFFSET :offset",
        );
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
        $stmt->bindValue(':offset', ($page - 1) * $pageSize, PDO::PARAM_INT);
        $stmt->execute();
        $items = array_map(self::mapListRow(...), $stmt->fetchAll());

        $countStmt = $db->prepare("SELECT COUNT(*) FROM books b WHERE {$where}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        return ['items' => $items, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize];
    }

    /** @return array{0:string,1:array<string,mixed>} */
    private static function buildListWhere(array $query): array
    {
        $conditions = ['b.is_published = 1', 'b.is_blocked = 0', 'b.suspended_at IS NULL'];
        $params = [];

        if ($query['categoryId'] !== null) {
            $conditions[] = 'b.id_category = :categoryId';
            $params[':categoryId'] = $query['categoryId'];
        }
        if ($query['authorId'] !== null) {
            $conditions[] = 'b.id_author = :authorId';
            $params[':authorId'] = $query['authorId'];
        }
        if ($query['isFree'] !== null) {
            $conditions[] = 'b.is_free = :isFree';
            $params[':isFree'] = $query['isFree'] ? 1 : 0;
        }
        if ($query['search'] !== null) {
            $conditions[] = 'b.title LIKE :search';
            $params[':search'] = '%' . $query['search'] . '%';
        }

        return [implode(' AND ', $conditions), $params];
    }

    public static function listBooksForAdmin(): array
    {
        $stmt = self::db()->query(
            'SELECT b.id_book AS id, b.title, b.slug, b.cover, b.is_published, b.is_blocked, b.suspended_at,
                    au.name AS author_name, au.email AS author_email,
                    (SELECT COUNT(*) FROM chapters ch WHERE ch.id_book = b.id_book) AS chapters_count
             FROM books b
             JOIN author au ON au.id_author = b.id_author
             ORDER BY b.created_at DESC',
        );

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'slug' => $row['slug'],
            'cover' => $row['cover'],
            'isPublished' => (bool) $row['is_published'],
            'isBlocked' => (bool) $row['is_blocked'],
            'suspendedAt' => $row['suspended_at'],
            'author' => ['name' => $row['author_name'], 'email' => $row['author_email']],
            '_count' => ['chapters' => (int) $row['chapters_count']],
        ], $stmt->fetchAll());
    }

    public static function moderateBook(int $id, string $action): ?array
    {
        $db = self::db();

        $exists = $db->prepare('SELECT id_book FROM books WHERE id_book = :id');
        $exists->execute(['id' => $id]);
        if ($exists->fetchColumn() === false) {
            throw ApiError::notFound('Livre introuvable');
        }

        if ($action === 'delete') {
            $count = $db->prepare('SELECT COUNT(*) FROM achat WHERE id_book = :id');
            $count->execute(['id' => $id]);
            if ((int) $count->fetchColumn() > 0) {
                throw ApiError::conflict('Impossible de supprimer un livre déjà attribué ou acheté ; bloquez-le plutôt');
            }
            $db->prepare('DELETE FROM books WHERE id_book = :id')->execute(['id' => $id]);
            return null;
        }

        $data = match ($action) {
            'publish' => ['is_published' => 1, 'is_blocked' => 0, 'suspended_at' => null],
            'unpublish' => ['is_published' => 0],
            'block' => ['is_published' => 0, 'is_blocked' => 1],
            'suspend' => ['is_published' => 0, 'suspended_at' => date('Y-m-d H:i:s')],
            default => throw ApiError::badRequest('Action invalide'),
        };

        $set = implode(', ', array_map(static fn (string $col): string => "{$col} = :{$col}", array_keys($data)));
        $stmt = $db->prepare("UPDATE books SET {$set} WHERE id_book = :id");
        $stmt->execute([...$data, 'id' => $id]);

        $select = $db->prepare('SELECT id_book AS id, is_published, is_blocked, suspended_at FROM books WHERE id_book = :id');
        $select->execute(['id' => $id]);
        $row = $select->fetch();

        return [
            'id' => (int) $row['id'],
            'isPublished' => (bool) $row['is_published'],
            'isBlocked' => (bool) $row['is_blocked'],
            'suspendedAt' => $row['suspended_at'],
        ];
    }

    // Livres les mieux notés : moyenne des avis (table `commentaires`), livres
    // sans aucun avis exclus (INNER JOIN via la sous-requête GROUP BY), plutôt
    // que traités comme note 0.
    public static function getTopRatedBooks(int $limit): array
    {
        $db = self::db();
        $grouped = $db->prepare(
            'SELECT id_book, AVG(rating) AS avg_rating, COUNT(rating) AS review_count
             FROM commentaires
             GROUP BY id_book
             ORDER BY avg_rating DESC
             LIMIT :limit',
        );
        $grouped->bindValue(':limit', $limit, PDO::PARAM_INT);
        $grouped->execute();
        $groups = $grouped->fetchAll();

        if ($groups === []) {
            return [];
        }

        $ids = array_map(static fn (array $g): int => (int) $g['id_book'], $groups);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $db->prepare(
            "SELECT b.id_book AS id, b.slug, b.title, b.cover, b.price, b.is_free, b.is_promotion,
                    b.promotion_price, b.date_pub, " . self::CATEGORY_FIELDS . ', ' . self::AUTHOR_FIELDS . "
             FROM books b
             JOIN category c ON c.id_category = b.id_category
             JOIN author au ON au.id_author = b.id_author
             WHERE b.id_book IN ({$placeholders})",
        );
        $stmt->execute($ids);
        $booksById = [];
        foreach ($stmt->fetchAll() as $row) {
            $booksById[(int) $row['id']] = self::mapListRow($row);
        }

        $result = [];
        foreach ($groups as $group) {
            $book = $booksById[(int) $group['id_book']] ?? null;
            if ($book === null) {
                continue;
            }
            $result[] = [...$book, 'averageRating' => (float) $group['avg_rating'], 'reviewCount' => (int) $group['review_count']];
        }

        return $result;
    }

    // Version "légère" (ownership checks update/delete) — cf. getBookDetailForViewer
    // pour la version publique enrichie.
    public static function getBookById(int $id): array
    {
        $stmt = self::db()->prepare(
            "SELECT b.*, " . self::CATEGORY_FIELDS . ', ' . self::AUTHOR_FIELDS . '
             FROM books b
             JOIN category c ON c.id_category = b.id_category
             JOIN author au ON au.id_author = b.id_author
             WHERE b.id_book = :id',
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Livre introuvable');
        }

        return self::mapFullBook($row);
    }

    private static function getBookBySlug(string $slug): array
    {
        $stmt = self::db()->prepare(
            "SELECT b.*, " . self::CATEGORY_FIELDS . ', ' . self::AUTHOR_FIELDS . '
             FROM books b
             JOIN category c ON c.id_category = b.id_category
             JOIN author au ON au.id_author = b.id_author
             WHERE b.slug = :slug',
        );
        $stmt->execute(['slug' => $slug]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Livre introuvable');
        }

        return self::mapFullBook($row);
    }

    /**
     * Équivalent de getBookDetailForViewer. $viewContext (facultatif) déclenche
     * le comptage de vue, comme côté Node.
     *
     * @param array{userId:?int,ip:string,userAgent:?string,country:?string}|null $viewContext
     */
    public static function getBookDetailForViewer(string $slug, ?int $viewerId, ?array $viewContext): array
    {
        $db = self::db();
        $book = self::getBookBySlug($slug);
        $bookId = $book['id'];

        $viewCount = $viewContext !== null
            ? ViewTrackingService::trackBookView($bookId, $viewContext)
            : (int) ($db->query("SELECT view_number FROM viewbooks WHERE book_id = {$bookId}")->fetchColumn() ?: 0);

        $likeCountStmt = $db->prepare('SELECT COUNT(*) FROM likes WHERE id_book = :id');
        $likeCountStmt->execute(['id' => $bookId]);
        $likeCount = (int) $likeCountStmt->fetchColumn();

        $isLikedByUser = false;
        if ($viewerId !== null) {
            $likeStmt = $db->prepare('SELECT 1 FROM likes WHERE id_book = :bookId AND id_user = :userId');
            $likeStmt->execute(['bookId' => $bookId, 'userId' => $viewerId]);
            $isLikedByUser = $likeStmt->fetchColumn() !== false;
        }

        $reviewStats = CommentsService::getBookReviewStats($bookId);

        $hasLegacyBookPurchase = false;
        $boughtPartIds = [];
        if ($viewerId !== null) {
            $purchasesStmt = $db->prepare('SELECT part_id FROM achat WHERE id_user = :userId AND id_book = :bookId');
            $purchasesStmt->execute(['userId' => $viewerId, 'bookId' => $bookId]);
            foreach ($purchasesStmt->fetchAll() as $purchase) {
                if ($purchase['part_id'] === null) {
                    $hasLegacyBookPurchase = true;
                } else {
                    $boughtPartIds[(int) $purchase['part_id']] = true;
                }
            }
        }

        $book['parts'] = array_map(
            static fn (array $part): array => [
                ...$part,
                'isPurchased' => $hasLegacyBookPurchase || isset($boughtPartIds[$part['id']]),
            ],
            $book['parts'],
        );

        return [...$book, 'viewCount' => $viewCount, 'likeCount' => $likeCount, 'isLikedByUser' => $isLikedByUser, ...$reviewStats];
    }

    // Slug figé à la création, jamais régénéré ensuite.
    private static function generateUniqueBookSlug(string $title): string
    {
        $base = Slugify::make($title) ?: 'livre';
        $slug = $base;
        $suffix = 2;

        $stmt = self::db()->prepare('SELECT id_book FROM books WHERE slug = :slug');
        while (true) {
            $stmt->execute(['slug' => $slug]);
            if ($stmt->fetchColumn() === false) {
                return $slug;
            }
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }
    }

    private static function assertCategoryExists(int $categoryId): void
    {
        $stmt = self::db()->prepare('SELECT id_category FROM category WHERE id_category = :id');
        $stmt->execute(['id' => $categoryId]);
        if ($stmt->fetchColumn() === false) {
            throw ApiError::badRequest('Catégorie introuvable');
        }
    }

    private static function assertAuthorExists(int $authorId): void
    {
        $stmt = self::db()->prepare('SELECT id_author FROM author WHERE id_author = :id');
        $stmt->execute(['id' => $authorId]);
        if ($stmt->fetchColumn() === false) {
            throw ApiError::badRequest('Auteur introuvable');
        }
    }

    /** @param array<string,mixed> $actingUser */
    public static function getBookForManage(int $id, array $actingUser): array
    {
        $book = self::getBookById($id);
        Ownership::assertAuthorOwnership($actingUser, $book['authorId']);
        return $book;
    }

    /**
     * @param array{email:string,note:?string} $input
     * @param array<string,mixed> $actingUser
     */
    public static function grantBookToReader(int $bookId, array $input, array $actingUser): array
    {
        $book = self::getBookById($bookId);
        Ownership::assertAuthorOwnership($actingUser, $book['authorId']);

        $userId = UsersService::getActiveUserIdByEmail($input['email']);

        return UsersService::grantBookToUser($userId, ['bookId' => $bookId, 'note' => $input['note']], (int) $actingUser['id'], 'author-grant');
    }

    /** @param array<string,mixed> $actingUser */
    public static function listMyBooks(array $actingUser): array
    {
        $isAdmin = ($actingUser['role'] ?? null) === 'admin';
        $authorId = $actingUser['authorId'] ?? null;

        if (!$isAdmin && $authorId === null) {
            return [];
        }

        $db = self::db();
        $sql = "SELECT b.id_book AS id, b.slug, b.title, b.cover, b.price, b.is_free, b.is_promotion,
                       b.promotion_price, b.date_pub, " . self::CATEGORY_FIELDS . ",
                       vb.view_number AS view_count,
                       (SELECT COUNT(*) FROM chapters ch WHERE ch.id_book = b.id_book) AS chapters_count,
                       (SELECT COUNT(*) FROM likes l WHERE l.id_book = b.id_book) AS likes_count,
                       (SELECT COUNT(*) FROM commentaires cm WHERE cm.id_book = b.id_book) AS comments_count
                FROM books b
                JOIN category c ON c.id_category = b.id_category
                LEFT JOIN viewbooks vb ON vb.book_id = b.id_book"
            . ($isAdmin ? '' : ' WHERE b.id_author = :authorId')
            . ' ORDER BY b.created_at DESC';

        $stmt = $db->prepare($sql);
        if (!$isAdmin) {
            $stmt->execute(['authorId' => $authorId]);
        } else {
            $stmt->execute();
        }

        return array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'slug' => $row['slug'],
                'title' => $row['title'],
                'cover' => $row['cover'],
                'price' => (int) $row['price'],
                'isFree' => (bool) $row['is_free'],
                'isPromotion' => (bool) $row['is_promotion'],
                'promotionPrice' => (int) $row['promotion_price'],
                'datePub' => $row['date_pub'],
                'category' => ['id' => (int) $row['category_id'], 'name' => $row['category_name'], 'description' => $row['category_description']],
                'viewStats' => $row['view_count'] !== null ? ['viewCount' => (int) $row['view_count']] : null,
                '_count' => [
                    'chapters' => (int) $row['chapters_count'],
                    'likes' => (int) $row['likes_count'],
                    'comments' => (int) $row['comments_count'],
                ],
            ];
        }, $stmt->fetchAll());
    }

    /** @param array<string,mixed> $actingUser */
    public static function createBook(array $input, array $actingUser): array
    {
        Ownership::assertAuthorOwnership($actingUser, $input['authorId']);
        self::assertCategoryExists($input['categoryId']);
        self::assertAuthorExists($input['authorId']);

        $slug = self::generateUniqueBookSlug($input['title']);
        $db = self::db();

        $db->beginTransaction();
        try {
            $insert = $db->prepare(
                'INSERT INTO books (
                    slug, title, date_pub, cover, file_path, price, page_number, book_link, resume,
                    is_free, read_before_pay, free_chapter_count, is_promotion, promotion_price,
                    is_adult_only, id_category, id_author, created_at, modified_at
                 ) VALUES (
                    :slug, :title, :datePub, :cover, :filePath, :price, :pageNumber, :bookLink, :resume,
                    :isFree, :readBeforePay, :freeChapterCount, :isPromotion, :promotionPrice,
                    :isAdultOnly, :categoryId, :authorId, NOW(), NOW()
                 )',
            );
            $insert->execute([
                'slug' => $slug,
                'title' => $input['title'],
                'datePub' => $input['datePub'],
                'cover' => $input['cover'],
                'filePath' => $input['filePath'],
                'price' => $input['price'],
                'pageNumber' => $input['pageNumber'],
                'bookLink' => $input['bookLink'],
                'resume' => $input['resume'],
                'isFree' => $input['isFree'] ? 1 : 0,
                'readBeforePay' => $input['readBeforePay'] ? 1 : 0,
                'freeChapterCount' => $input['freeChapterCount'],
                'isPromotion' => $input['isPromotion'] ? 1 : 0,
                'promotionPrice' => $input['promotionPrice'],
                'isAdultOnly' => $input['isAdultOnly'] ? 1 : 0,
                'categoryId' => $input['categoryId'],
                'authorId' => $input['authorId'],
            ]);
            $bookId = (int) $db->lastInsertId();

            if ($input['extension'] !== null) {
                self::upsertExtension($bookId, $input['extension']);
            }

            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        return self::getBookById($bookId);
    }

    /** @param array<string,mixed> $actingUser */
    public static function updateBook(int $id, array $input, array $actingUser): array
    {
        $book = self::getBookById($id);
        Ownership::assertAuthorOwnership($actingUser, $book['authorId']);
        if (isset($input['categoryId'])) {
            self::assertCategoryExists($input['categoryId']);
        }

        $columnMap = [
            'title' => 'title', 'datePub' => 'date_pub', 'cover' => 'cover', 'filePath' => 'file_path',
            'price' => 'price', 'pageNumber' => 'page_number', 'bookLink' => 'book_link', 'resume' => 'resume',
            'isFree' => 'is_free', 'readBeforePay' => 'read_before_pay', 'freeChapterCount' => 'free_chapter_count',
            'isPromotion' => 'is_promotion', 'promotionPrice' => 'promotion_price', 'isAdultOnly' => 'is_adult_only',
            'categoryId' => 'id_category',
        ];

        $set = ['modified_at = NOW()'];
        $params = ['id' => $id];
        foreach ($columnMap as $field => $column) {
            if (!array_key_exists($field, $input)) {
                continue;
            }
            $value = $input[$field];
            $set[] = "{$column} = :{$column}";
            $params[$column] = is_bool($value) ? (int) $value : $value;
        }

        $db = self::db();
        $db->beginTransaction();
        try {
            if (count($set) > 1) {
                $db->prepare('UPDATE books SET ' . implode(', ', $set) . ' WHERE id_book = :id')->execute($params);
            }
            if (array_key_exists('extension', $input) && $input['extension'] !== null) {
                self::upsertExtension($id, $input['extension']);
            }
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        return self::getBookById($id);
    }

    /** @param array{introduction:?string,topics:?string,conclusion:?string,language:?string} $extension */
    private static function upsertExtension(int $bookId, array $extension): void
    {
        self::db()->prepare(
            'INSERT INTO books_extension (book_id, introduction, topics, conclusion, language, created_at)
             VALUES (:bookId, :introduction, :topics, :conclusion, :language, NOW())
             ON DUPLICATE KEY UPDATE introduction = VALUES(introduction), topics = VALUES(topics),
                 conclusion = VALUES(conclusion), language = VALUES(language), modified_at = NOW()',
        )->execute([
            'bookId' => $bookId,
            'introduction' => $extension['introduction'],
            'topics' => $extension['topics'],
            'conclusion' => $extension['conclusion'],
            'language' => $extension['language'],
        ]);
    }

    /** @param array<string,mixed> $actingUser */
    public static function deleteBook(int $id, array $actingUser): void
    {
        $book = self::getBookById($id);
        Ownership::assertAuthorOwnership($actingUser, $book['authorId']);

        try {
            self::db()->prepare('DELETE FROM books WHERE id_book = :id')->execute(['id' => $id]);
        } catch (\PDOException $e) {
            // FK onDelete: Restrict sur `achat` — on préserve l'historique
            // d'achats, un livre déjà vendu ne doit pas pouvoir être supprimé.
            if ((int) $e->getCode() === 23000 || str_contains($e->getMessage(), '1451')) {
                throw ApiError::conflict('Impossible de supprimer un livre ayant déjà été acheté');
            }
            throw $e;
        }
    }

    // -- Mapping lignes SQL -> tableaux "camelCase", équivalent des `select` Prisma --

    private static function mapListRow(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'slug' => $row['slug'],
            'title' => $row['title'],
            'cover' => $row['cover'],
            'price' => (int) $row['price'],
            'isFree' => (bool) $row['is_free'],
            'isPromotion' => (bool) $row['is_promotion'],
            'promotionPrice' => (int) $row['promotion_price'],
            'isAdultOnly' => isset($row['is_adult_only']) ? (bool) $row['is_adult_only'] : null,
            'datePub' => $row['date_pub'],
            'category' => self::mapCategory($row),
            'author' => self::mapAuthor($row),
        ];
    }

    private static function mapCategory(array $row): array
    {
        return ['id' => (int) $row['category_id'], 'name' => $row['category_name'], 'description' => $row['category_description']];
    }

    private static function mapAuthor(array $row): array
    {
        return [
            'id' => (int) $row['author_row_id'],
            'name' => $row['author_name'],
            'designation' => $row['author_designation'],
            'image' => $row['author_image'],
            'cover' => $row['author_cover'],
            'about' => $row['author_about'],
        ];
    }

    private static function mapFullBook(array $row): array
    {
        $bookId = (int) $row['id_book'];

        return [
            'id' => $bookId,
            'slug' => $row['slug'],
            'title' => $row['title'],
            'datePub' => $row['date_pub'],
            'cover' => $row['cover'],
            'filePath' => $row['file_path'],
            'price' => (int) $row['price'],
            'pageNumber' => (int) $row['page_number'],
            'bookLink' => $row['book_link'],
            'resume' => $row['resume'],
            'isFree' => (bool) $row['is_free'],
            'readBeforePay' => (bool) $row['read_before_pay'],
            'freeChapterCount' => (int) $row['free_chapter_count'],
            'isPromotion' => (bool) $row['is_promotion'],
            'promotionPrice' => (int) $row['promotion_price'],
            'isAdultOnly' => (bool) $row['is_adult_only'],
            'isPublished' => (bool) $row['is_published'],
            'isBlocked' => (bool) $row['is_blocked'],
            'suspendedAt' => $row['suspended_at'],
            'categoryId' => (int) $row['id_category'],
            'authorId' => (int) $row['id_author'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['modified_at'],
            'category' => self::mapCategory($row),
            'author' => self::mapAuthor($row),
            'extension' => self::fetchExtension($bookId),
            'parts' => self::fetchParts($bookId),
            'chapters' => self::fetchChapters($bookId),
        ];
    }

    private static function fetchExtension(int $bookId): ?array
    {
        $stmt = self::db()->prepare('SELECT introduction, topics, conclusion, language FROM books_extension WHERE book_id = :id');
        $stmt->execute(['id' => $bookId]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    private static function fetchParts(int $bookId): array
    {
        $stmt = self::db()->prepare(
            'SELECT id_book_part AS id, title, part_number, description, price, is_free, free_chapter_count
             FROM book_parts WHERE book_id = :id ORDER BY part_number ASC',
        );
        $stmt->execute(['id' => $bookId]);

        return array_map(static function (array $part) use ($bookId): array {
            $partId = (int) $part['id'];
            $chapters = self::db()->prepare(
                'SELECT id_chapter AS id, chapter_title AS title, chapter_number AS chapterNumber, part_id AS partId
                 FROM chapters WHERE id_book = :bookId AND part_id = :partId ORDER BY chapter_number ASC',
            );
            $chapters->execute(['bookId' => $bookId, 'partId' => $partId]);

            return [
                'id' => $partId,
                'title' => $part['title'],
                'partNumber' => (int) $part['part_number'],
                'description' => $part['description'],
                'price' => (int) $part['price'],
                'isFree' => (bool) $part['is_free'],
                'freeChapterCount' => (int) $part['free_chapter_count'],
                'chapters' => array_map(static fn (array $c): array => [
                    'id' => (int) $c['id'],
                    'title' => $c['title'],
                    'chapterNumber' => (int) $c['chapterNumber'],
                    'partId' => $c['partId'] !== null ? (int) $c['partId'] : null,
                ], $chapters->fetchAll()),
            ];
        }, $stmt->fetchAll());
    }

    private static function fetchChapters(int $bookId): array
    {
        $stmt = self::db()->prepare(
            'SELECT id_chapter AS id, chapter_title AS title, chapter_number AS chapterNumber, part_id AS partId
             FROM chapters WHERE id_book = :id ORDER BY chapter_number ASC',
        );
        $stmt->execute(['id' => $bookId]);

        return array_map(static fn (array $c): array => [
            'id' => (int) $c['id'],
            'title' => $c['title'],
            'chapterNumber' => (int) $c['chapterNumber'],
            'partId' => $c['partId'] !== null ? (int) $c['partId'] : null,
        ], $stmt->fetchAll());
    }
}
