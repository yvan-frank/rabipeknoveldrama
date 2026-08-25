<?php

declare(strict_types=1);

namespace App\Modules\Support;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/support/support.controller.ts.
 */
final class SupportController
{
    public static function myMessages(Request $request): void
    {
        Response::success(['messages' => SupportService::getMyMessages((int) $request->user['id'])]);
    }

    public static function unreadCount(Request $request): void
    {
        Response::success(['unreadCount' => SupportService::getUnreadCountForUser((int) $request->user['id'])]);
    }

    public static function sendAsUser(Request $request): void
    {
        $content = SupportSchema::messageContent($request->body);
        Response::success(SupportService::sendMessageAsUser((int) $request->user['id'], $content), 201);
    }

    public static function listConversationsForAdmin(Request $request): void
    {
        Response::success(['conversations' => SupportService::listConversationsForAdmin()]);
    }

    public static function conversationForAdmin(Request $request): void
    {
        $userId = SupportSchema::userIdParam($request->params['userId']);
        Response::success(SupportService::getConversationForAdmin($userId));
    }

    public static function sendAsAdmin(Request $request): void
    {
        $userId = SupportSchema::userIdParam($request->params['userId']);
        $content = SupportSchema::messageContent($request->body);
        Response::success(SupportService::sendMessageAsAdmin($userId, $content), 201);
    }
}
