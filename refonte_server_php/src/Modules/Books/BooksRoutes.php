<?php

declare(strict_types=1);

namespace App\Modules\Books;

use App\Http\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\AuthorKycMiddleware;

/**
 * Miroir de src/modules/books/books.routes.ts. Ordre des routes préservé à
 * l'identique (important : `/top-rated`, `/administration/catalogue`,
 * `/mine`, `/manage/:id` doivent précéder `/:slug` pour ne pas en être
 * capturées, comme côté Express).
 */
final class BooksRoutes
{
    public static function register(Router $router): void
    {
        $authorOrAdmin = [
            AuthMiddleware::requireAuth(...),
            AuthMiddleware::requireRole('author', 'admin'),
        ];
        $authorOrAdminWithKyc = [...$authorOrAdmin, AuthorKycMiddleware::requireAuthorKyc(...)];
        $adminOnly = [AuthMiddleware::requireAuth(...), AuthMiddleware::requireRole('admin')];

        $router->get('/', [BooksController::class, 'list']);
        $router->get('/top-rated', [BooksController::class, 'topRated']);
        $router->post('/:id/grants', [BooksController::class, 'grant'], $authorOrAdminWithKyc);
        $router->get('/administration/catalogue', [BooksController::class, 'listForAdmin'], $adminOnly);
        $router->patch('/:id/moderation', [BooksController::class, 'moderate'], $adminOnly);
        $router->get('/mine', [BooksController::class, 'listMine'], $authorOrAdmin);
        $router->get('/manage/:id', [BooksController::class, 'manage'], $authorOrAdmin);
        $router->get('/:slug', [BooksController::class, 'show'], [AuthMiddleware::optionalAuth(...)]);
        $router->post('/', [BooksController::class, 'create'], $authorOrAdminWithKyc);
        $router->patch('/:id', [BooksController::class, 'update'], $authorOrAdminWithKyc);
        $router->delete('/:id', [BooksController::class, 'delete'], $authorOrAdminWithKyc);
    }
}
