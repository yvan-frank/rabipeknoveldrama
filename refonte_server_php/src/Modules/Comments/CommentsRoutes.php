<?php

declare(strict_types=1);

namespace App\Modules\Comments;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

/**
 * Miroir de src/modules/comments/comments.routes.ts.
 */
final class CommentsRoutes
{
    public static function register(Router $router): void
    {
        $router->get('/book/:bookId', [CommentsController::class, 'listBookReviews']);
        $router->post('/book/:bookId', [CommentsController::class, 'upsertBookReview'], [AuthMiddleware::requireAuth(...)]);
        $router->post('/review/:commentId/reply', [CommentsController::class, 'replyToBookReview'], [
            AuthMiddleware::requireAuth(...),
            AuthMiddleware::requireRole('author', 'admin'),
        ]);
        $router->get('/chapter/:chapterId', [CommentsController::class, 'listChapterComments']);
        $router->post('/chapter/:chapterId', [CommentsController::class, 'createChapterComment'], [AuthMiddleware::requireAuth(...)]);
        $router->delete('/chapter-comment/:commentId', [CommentsController::class, 'deleteChapterComment'], [AuthMiddleware::requireAuth(...)]);
    }
}
