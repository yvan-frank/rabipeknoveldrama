<?php

declare(strict_types=1);

namespace App\Modules\Support;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

/**
 * Miroir de src/modules/support/support.routes.ts.
 */
final class SupportRoutes
{
    public static function register(Router $router): void
    {
        $auth = [AuthMiddleware::requireAuth(...)];
        $adminOnly = [AuthMiddleware::requireAuth(...), AuthMiddleware::requireRole('admin')];

        $router->get('/messages', [SupportController::class, 'myMessages'], $auth);
        $router->get('/messages/unread-count', [SupportController::class, 'unreadCount'], $auth);
        $router->post('/messages', [SupportController::class, 'sendAsUser'], $auth);

        // -- Administration (même convention d'URL que users/books) --
        $router->get('/administration/conversations', [SupportController::class, 'listConversationsForAdmin'], $adminOnly);
        $router->get('/administration/conversations/:userId', [SupportController::class, 'conversationForAdmin'], $adminOnly);
        $router->post('/administration/conversations/:userId/messages', [SupportController::class, 'sendAsAdmin'], $adminOnly);
    }
}
