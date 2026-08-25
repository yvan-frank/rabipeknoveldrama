<?php

declare(strict_types=1);

namespace App\Modules\Notifications;

use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/notifications/notifications.schema.ts.
 */
final class NotificationsSchema
{
    /** @param array<string,mixed> $body */
    public static function pushToken(array $body): string
    {
        $token = is_string($body['token'] ?? null) ? trim($body['token']) : '';
        if (mb_strlen($token) < 10 || mb_strlen($token) > 255) {
            throw new ValidationException(['token' => ['Doit faire entre 10 et 255 caractères']]);
        }
        return $token;
    }
}
