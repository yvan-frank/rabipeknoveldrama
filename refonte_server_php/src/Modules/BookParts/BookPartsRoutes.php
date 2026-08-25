<?php

declare(strict_types=1);

namespace App\Modules\BookParts;

use App\Http\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\AuthorKycMiddleware;

/**
 * Miroir de src/modules/book-parts/book-parts.routes.ts.
 */
final class BookPartsRoutes
{
    public static function register(Router $router): void
    {
        $authorOrAdminWithKyc = [
            AuthMiddleware::requireAuth(...),
            AuthMiddleware::requireRole('author', 'admin'),
            AuthorKycMiddleware::requireAuthorKyc(...),
        ];

        $router->get('/book/:bookId', [BookPartsController::class, 'listByBook']);
        $router->post('/', [BookPartsController::class, 'create'], $authorOrAdminWithKyc);
        $router->patch('/:id', [BookPartsController::class, 'update'], $authorOrAdminWithKyc);
        $router->delete('/:id', [BookPartsController::class, 'delete'], $authorOrAdminWithKyc);
    }
}
