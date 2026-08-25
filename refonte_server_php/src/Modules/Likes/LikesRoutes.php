<?php

declare(strict_types=1);

namespace App\Modules\Likes;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

final class LikesRoutes
{
    public static function register(Router $router): void
    {
        $router->post('/books/:bookId', [LikesController::class, 'toggle'], [AuthMiddleware::requireAuth(...)]);
    }
}
