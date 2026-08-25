<?php

declare(strict_types=1);

namespace App\Modules\Notifications;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/notifications/notifications.controller.ts.
 */
final class NotificationsController
{
    public static function register(Request $request): void
    {
        $token = NotificationsSchema::pushToken($request->body);
        NotificationsService::registerPushToken((int) $request->user['id'], $token);
        Response::success(null);
    }

    public static function unregister(Request $request): void
    {
        $token = NotificationsSchema::pushToken($request->body);
        NotificationsService::unregisterPushToken((int) $request->user['id'], $token);
        Response::success(null);
    }
}
