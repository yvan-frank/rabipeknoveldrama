<?php

declare(strict_types=1);

namespace App\Modules\Authors;

use App\Http\Router;
use App\Http\Stub;
use App\Middleware\AuthMiddleware;

/**
 * Miroir de src/modules/authors/authors.routes.ts. GET / reste un stub
 * côté Node (liste publique des auteurs — jamais écrite, cf. TODO source) ;
 * ce scaffold ne l'invente pas non plus.
 *
 * KYC : volontairement PAS gardé par AuthorKycMiddleware, sous peine de ne
 * jamais pouvoir le soumettre (poule/œuf) — cf. AuthorKycMiddleware.php.
 */
final class AuthorsRoutes
{
    public static function register(Router $router): void
    {
        $router->get('/', Stub::notImplemented(...));

        $router->get('/moi/kyc', [AuthorsController::class, 'getMyKyc'], [
            AuthMiddleware::requireAuth(...),
            AuthMiddleware::requireRole('author'),
        ]);
        $router->post('/moi/kyc', [AuthorsController::class, 'submitKyc'], [
            AuthMiddleware::requireAuth(...),
            AuthMiddleware::requireRole('author'),
        ]);

        $adminOnly = [AuthMiddleware::requireAuth(...), AuthMiddleware::requireRole('admin')];

        $router->get('/kyc', [AuthorsController::class, 'listForKycReview'], $adminOnly);
        $router->get('/kyc-bypass', [AuthorsController::class, 'getKycBypassPolicy'], $adminOnly);
        $router->patch('/kyc-bypass', [AuthorsController::class, 'setKycBypassPolicy'], $adminOnly);
        $router->patch('/:authorId/kyc-verification', [AuthorsController::class, 'setKycVerification'], $adminOnly);
        // Doit rester APRÈS les routes littérales ci-dessus (routeur =
        // premier match gagne dans l'ordre d'enregistrement) : sinon
        // PATCH /kyc-bypass matcherait ce segment dynamique en premier.
        $router->patch('/:authorId', [AuthorsController::class, 'update'], $adminOnly);
        $router->delete('/:authorId', [AuthorsController::class, 'delete'], $adminOnly);
    }
}
