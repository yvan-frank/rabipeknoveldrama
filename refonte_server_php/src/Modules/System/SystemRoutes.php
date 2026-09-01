<?php

declare(strict_types=1);

namespace App\Modules\System;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

final class SystemRoutes
{
    public static function register(Router $router): void
    {
        $adminOnly = [AuthMiddleware::requireAuth(...), AuthMiddleware::requireRole('admin')];

        $router->post('/smtp-test', [SystemController::class, 'testSmtp'], $adminOnly);
    }
}
