<?php

declare(strict_types=1);

namespace App\Modules\Users;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

/**
 * Miroir de src/modules/users/users.routes.ts.
 */
final class UsersRoutes
{
    public static function register(Router $router): void
    {
        $router->get('/moi/tableau-de-bord', [UsersController::class, 'myDashboard'], [
            AuthMiddleware::requireAuth(...),
            AuthMiddleware::requireRole('user'),
        ]);
        $router->get('/administration/tableau-de-bord', [UsersController::class, 'adminDashboard'], [
            AuthMiddleware::requireAuth(...),
            AuthMiddleware::requireRole('admin'),
        ]);

        $adminOnly = [AuthMiddleware::requireAuth(...), AuthMiddleware::requireRole('admin')];

        $router->get('/', [UsersController::class, 'list'], $adminOnly);
        $router->get('/book-grants', [UsersController::class, 'listBookGrants'], $adminOnly);
        $router->delete('/book-grants/:grantId', [UsersController::class, 'revokeBookGrant'], $adminOnly);
        $router->post('/:id/book-grants', [UsersController::class, 'grantBook'], $adminOnly);
        $router->get('/:id', [UsersController::class, 'show'], $adminOnly);
        $router->delete('/:id', [UsersController::class, 'delete'], $adminOnly);
    }
}
