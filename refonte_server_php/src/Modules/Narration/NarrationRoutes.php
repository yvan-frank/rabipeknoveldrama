<?php

declare(strict_types=1);

namespace App\Modules\Narration;

use App\Http\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\AuthorKycMiddleware;

/**
 * Monté sous /chapters (cf. Routes.php), même préfixe que ChaptersRoutes —
 * même garde KYC que la création/édition de chapitre : générer une narration
 * est une action de gestion de contenu auteur comme une autre.
 */
final class NarrationRoutes
{
    public static function register(Router $router): void
    {
        $authorOrAdminWithKyc = [
            AuthMiddleware::requireAuth(...),
            AuthMiddleware::requireRole('author', 'admin'),
            AuthorKycMiddleware::requireAuthorKyc(...),
        ];

        $router->post('/:id/narration', [NarrationController::class, 'generate'], $authorOrAdminWithKyc);
        $router->get('/:id/narration', [NarrationController::class, 'status'], $authorOrAdminWithKyc);
        $router->post('/:id/narration/cancel', [NarrationController::class, 'cancel'], $authorOrAdminWithKyc);
    }
}
