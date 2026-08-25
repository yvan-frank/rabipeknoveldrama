<?php

declare(strict_types=1);

namespace App\Modules\Support;

use App\Lib\Database;
use App\Modules\Notifications\NotificationsService;
use App\Utils\ApiError;
use PDO;

/**
 * Équivalent de src/modules/support/support.service.ts. Un seul fil par
 * utilisateur (cf. schema.prisma) : "la conversation" EST l'ensemble de ses
 * support_messages, pas besoin d'une entité séparée.
 */
final class SupportService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    // Ouvrir le fil vaut lecture des réponses du support reçues depuis.
    public static function getMyMessages(int $userId): array
    {
        $db = self::db();
        $messages = self::fetchMessages($db, $userId);

        $db->prepare("UPDATE support_messages SET read_by_user = 1 WHERE user_id = :userId AND sender = 'admin' AND read_by_user = 0")
            ->execute(['userId' => $userId]);

        return $messages;
    }

    public static function getUnreadCountForUser(int $userId): int
    {
        $stmt = self::db()->prepare("SELECT COUNT(*) FROM support_messages WHERE user_id = :userId AND sender = 'admin' AND read_by_user = 0");
        $stmt->execute(['userId' => $userId]);
        return (int) $stmt->fetchColumn();
    }

    public static function sendMessageAsUser(int $userId, string $content): array
    {
        $db = self::db();
        $db->prepare("INSERT INTO support_messages (user_id, sender, content, created_at) VALUES (:userId, 'user', :content, NOW())")
            ->execute(['userId' => $userId, 'content' => $content]);

        return self::fetchMessage($db, (int) $db->lastInsertId());
    }

    // -- Côté admin (cf. SupportRoutes, requireRole('admin')) --------------

    public static function listConversationsForAdmin(): array
    {
        $db = self::db();
        $usersStmt = $db->query(
            'SELECT DISTINCT u.id_user, u.name, u.email FROM users u
             JOIN support_messages sm ON sm.user_id = u.id_user',
        );

        $conversations = [];
        foreach ($usersStmt->fetchAll() as $user) {
            $userId = (int) $user['id_user'];

            $lastStmt = $db->prepare('SELECT content, created_at, sender FROM support_messages WHERE user_id = :userId ORDER BY created_at DESC LIMIT 1');
            $lastStmt->execute(['userId' => $userId]);
            $last = $lastStmt->fetch();

            $unreadStmt = $db->prepare("SELECT COUNT(*) FROM support_messages WHERE user_id = :userId AND sender = 'user' AND read_by_admin = 0");
            $unreadStmt->execute(['userId' => $userId]);

            $conversations[] = [
                'userId' => $userId,
                'name' => $user['name'],
                'email' => $user['email'],
                'lastMessage' => $last === false ? null : ['content' => $last['content'], 'createdAt' => $last['created_at'], 'sender' => $last['sender']],
                'unreadCount' => (int) $unreadStmt->fetchColumn(),
                '_sortKey' => $last === false ? '' : $last['created_at'],
            ];
        }

        usort($conversations, static fn (array $a, array $b): int => strcmp($b['_sortKey'], $a['_sortKey']));

        return array_map(static function (array $c): array {
            unset($c['_sortKey']);
            return $c;
        }, $conversations);
    }

    public static function getConversationForAdmin(int $userId): array
    {
        $db = self::db();
        $userStmt = $db->prepare('SELECT id_user, name, email FROM users WHERE id_user = :id');
        $userStmt->execute(['id' => $userId]);
        $user = $userStmt->fetch();
        if ($user === false) {
            throw ApiError::notFound('Utilisateur introuvable');
        }

        $messages = self::fetchMessages($db, $userId);

        $db->prepare("UPDATE support_messages SET read_by_admin = 1 WHERE user_id = :userId AND sender = 'user' AND read_by_admin = 0")
            ->execute(['userId' => $userId]);

        return [
            'user' => ['id' => (int) $user['id_user'], 'name' => $user['name'], 'email' => $user['email']],
            'messages' => $messages,
        ];
    }

    public static function sendMessageAsAdmin(int $userId, string $content): array
    {
        $db = self::db();
        $userStmt = $db->prepare('SELECT id_user FROM users WHERE id_user = :id');
        $userStmt->execute(['id' => $userId]);
        if ($userStmt->fetchColumn() === false) {
            throw ApiError::notFound('Utilisateur introuvable');
        }

        $db->prepare("INSERT INTO support_messages (user_id, sender, content, created_at) VALUES (:userId, 'admin', :content, NOW())")
            ->execute(['userId' => $userId, 'content' => $content]);
        $message = self::fetchMessage($db, (int) $db->lastInsertId());

        // Best-effort : une notification manquée ne doit pas faire échouer
        // l'envoi du message lui-même (cf. NotificationsService::sendPushToUser,
        // fire-and-forget par conception).
        NotificationsService::sendPushToUser($userId, 'Réponse du support', mb_substr($content, 0, 120), ['type' => 'support-reply']);

        return $message;
    }

    private static function fetchMessages(PDO $db, int $userId): array
    {
        $stmt = $db->prepare('SELECT id, sender, content, created_at FROM support_messages WHERE user_id = :userId ORDER BY created_at ASC');
        $stmt->execute(['userId' => $userId]);

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'sender' => $row['sender'],
            'content' => $row['content'],
            'createdAt' => $row['created_at'],
        ], $stmt->fetchAll());
    }

    private static function fetchMessage(PDO $db, int $id): array
    {
        $stmt = $db->prepare('SELECT id, sender, content, created_at FROM support_messages WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return ['id' => (int) $row['id'], 'sender' => $row['sender'], 'content' => $row['content'], 'createdAt' => $row['created_at']];
    }
}
