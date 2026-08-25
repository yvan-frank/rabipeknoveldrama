<?php

declare(strict_types=1);

namespace App\Modules\Epub;

use App\Http\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\AuthorKycMiddleware;

/**
 * Miroir de src/modules/epub/epub.routes.ts — trois routeurs Express
 * distincts, rendus ici comme trois méthodes de montage appelées séparément
 * par Routes.php (même raison que côté Node : éviter qu'un middleware auteur
 * s'applique aussi à reading-progress, monté au même préfixe /books).
 */
final class EpubRoutes
{
    public static function registerEditions(Router $router): void
    {
        $router->get('/:id/download', [EpubController::class, 'download'], [AuthMiddleware::requireAuth(...)]);
    }

    public static function registerBookEditions(Router $router): void
    {
        $requireAuthorAccess = [
            AuthMiddleware::requireAuth(...),
            AuthMiddleware::requireRole('author', 'admin'),
            AuthorKycMiddleware::requireAuthorKyc(...),
        ];

        $router->get('/:id/epub-editions', [EpubController::class, 'listEditions'], $requireAuthorAccess);
        $router->post('/:id/epub-editions', [EpubController::class, 'create'], $requireAuthorAccess);
    }

    // Distinct de registerBookEditions ci-dessus : accessible à tout
    // utilisateur authentifié (pas seulement l'auteur/admin), pour que l'app
    // mobile lecteur puisse savoir si une édition à jour existe.
    public static function registerBookReader(Router $router): void
    {
        $router->get('/:id/epub-editions/current', [EpubController::class, 'currentEdition'], [AuthMiddleware::requireAuth(...)]);
    }
}
