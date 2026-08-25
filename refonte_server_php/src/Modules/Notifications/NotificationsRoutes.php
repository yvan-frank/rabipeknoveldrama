<?php

declare(strict_types=1);

namespace App\Modules\Notifications;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

final class NotificationsRoutes
{
    public static function register(Router $router): void
    {
        $auth = [AuthMiddleware::requireAuth(...)];

        $router->post('/push-token', [NotificationsController::class, 'register'], $auth);
        $router->delete('/push-token', [NotificationsController::class, 'unregister'], $auth);
    }
}
