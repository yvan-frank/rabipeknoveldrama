<?php

declare(strict_types=1);

namespace App\Modules\Notifications;

use App\Lib\Database;
use App\Lib\Logger;
use PDO;

/**
 * Équivalent de src/modules/notifications/notifications.service.ts.
 */
final class NotificationsService
{
    private const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
    // Limite documentée par Expo pour un seul appel à /push/send.
    private const EXPO_PUSH_BATCH_SIZE = 100;

    private static function db(): PDO
    {
        return Database::connection();
    }

    public static function registerPushToken(int $userId, string $token): void
    {
        // Le jeton peut appartenir à un autre compte si l'appareil a changé
        // d'utilisateur entre-temps (déconnexion/reconnexion sur le même
        // appareil) : on le réattribue plutôt que d'échouer sur l'unicité.
        self::db()->prepare(
            'INSERT INTO push_tokens (user_id, token, created_at, updated_at) VALUES (:userId, :token, NOW(), NOW())
             ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), updated_at = NOW()',
        )->execute(['userId' => $userId, 'token' => $token]);
    }

    public static function unregisterPushToken(int $userId, string $token): void
    {
        self::db()->prepare('DELETE FROM push_tokens WHERE user_id = :userId AND token = :token')
            ->execute(['userId' => $userId, 'token' => $token]);
    }

    /** @param list<array{to:string,title:string,body:string,data?:array<string,mixed>}> $messages */
    private static function sendExpoPushBatch(array $messages): void
    {
        if ($messages === []) {
            return;
        }

        $ch = curl_init(self::EXPO_PUSH_URL);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_POSTFIELDS => json_encode($messages, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT => 10,
        ]);
        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false || $status < 200 || $status >= 300) {
            Logger::warn("Réponse non-OK de l'API Expo Push", ['status' => $status, 'error' => $error]);
        }
    }

    // Fire-and-forget par conception : une notification manquée n'est jamais
    // une raison de faire échouer l'action qui l'a déclenchée (ex. une
    // réponse support envoyée avec succès ne doit pas devenir une erreur 500
    // juste parce que l'utilisateur a désinstallé l'app depuis).
    /** @param array<string,mixed>|null $data */
    public static function sendPushToUser(int $userId, string $title, string $body, ?array $data = null): void
    {
        try {
            $stmt = self::db()->prepare('SELECT token FROM push_tokens WHERE user_id = :userId');
            $stmt->execute(['userId' => $userId]);
            $tokens = array_column($stmt->fetchAll(), 'token');
            if ($tokens === []) {
                return;
            }

            self::sendExpoPushBatch(array_map(static fn (string $token): array => [
                'to' => $token,
                'title' => $title,
                'body' => $body,
                ...($data !== null ? ['data' => $data] : []),
            ], $tokens));
        } catch (\Throwable $e) {
            Logger::error("Échec d'envoi d'une notification push Expo", ['error' => $e->getMessage()]);
        }
    }

    // Relance uniquement les utilisateurs déjà engagés dans une série
    // (dernier check-in = hier) qui ne l'ont pas encore validée aujourd'hui.
    // Équivalent du cron node-cron de server.ts (19h chaque jour) — à
    // déclencher côté PHP via une tâche cron système appelant
    // bin/send-checkin-reminders.php, faute de process serveur persistant.
    public static function sendCheckInReminders(): array
    {
        $db = self::db();
        $today = gmdate('Y-m-d');
        $yesterday = gmdate('Y-m-d', strtotime($today . ' UTC') - 86400);

        $candidatesStmt = $db->prepare(
            'SELECT DISTINCT u.id_user
             FROM users u
             JOIN push_tokens pt ON pt.user_id = u.id_user
             JOIN check_ins ci_yesterday ON ci_yesterday.user_id = u.id_user AND ci_yesterday.check_in_date = :yesterday
             WHERE NOT EXISTS (
                 SELECT 1 FROM check_ins ci_today WHERE ci_today.user_id = u.id_user AND ci_today.check_in_date = :today
             )',
        );
        $candidatesStmt->execute(['yesterday' => $yesterday, 'today' => $today]);
        $candidateIds = array_map('intval', array_column($candidatesStmt->fetchAll(), 'id_user'));

        $allMessages = [];
        foreach ($candidateIds as $userId) {
            $tokensStmt = $db->prepare('SELECT token FROM push_tokens WHERE user_id = :userId');
            $tokensStmt->execute(['userId' => $userId]);
            foreach (array_column($tokensStmt->fetchAll(), 'token') as $token) {
                $allMessages[] = [
                    'to' => $token,
                    'title' => 'Ne perdez pas votre série !',
                    'body' => 'Faites votre check-in du jour pour continuer à cumuler vos bonus.',
                    'data' => ['type' => 'checkin-reminder'],
                ];
            }
        }

        foreach (array_chunk($allMessages, self::EXPO_PUSH_BATCH_SIZE) as $batch) {
            self::sendExpoPushBatch($batch);
        }

        return ['usersNotified' => count($candidateIds)];
    }
}
