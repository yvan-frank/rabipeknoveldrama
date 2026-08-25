<?php

declare(strict_types=1);

namespace App\Modules\Chapters;

use App\Http\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\AuthorKycMiddleware;

/**
 * Miroir de src/modules/chapters/chapters.routes.ts. `/manage/:id` doit
 * précéder `/:id` pour ne pas en être capturé, comme côté Express.
 */
final class ChaptersRoutes
{
    public static function register(Router $router): void
    {
        $authorOrAdmin = [AuthMiddleware::requireAuth(...), AuthMiddleware::requireRole('author', 'admin')];
        $authorOrAdminWithKyc = [...$authorOrAdmin, AuthorKycMiddleware::requireAuthorKyc(...)];

        $router->get('/book/:bookId', [ChaptersController::class, 'listByBook']);
        $router->get('/manage/:id', [ChaptersController::class, 'manage'], $authorOrAdmin);
        $router->get('/:id', [ChaptersController::class, 'show'], [AuthMiddleware::optionalAuth(...)]);
        $router->post('/', [ChaptersController::class, 'create'], $authorOrAdminWithKyc);
        $router->patch('/:id', [ChaptersController::class, 'update'], $authorOrAdminWithKyc);
        $router->delete('/:id', [ChaptersController::class, 'delete'], $authorOrAdminWithKyc);
    }
}
