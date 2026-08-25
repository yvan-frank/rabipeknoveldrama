<?php

declare(strict_types=1);

namespace App\Modules\Stats;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

/**
 * Miroir de src/modules/stats/stats.routes.ts.
 *
 * Note : la source Node déclare deux fois `GET /books/:id/summary` (la
 * seconde, un stub 501, est du code mort qu'Express n'atteint jamais — la
 * première déclaration matche toujours en premier). Non reproduit ici.
 */
final class StatsRoutes
{
    public static function register(Router $router): void
    {
        $authorOrAdmin = [AuthMiddleware::requireAuth(...), AuthMiddleware::requireRole('author', 'admin')];

        $router->get('/books/:id/summary', [StatsController::class, 'summary'], $authorOrAdmin);
        $router->get('/books/:id/views', [StatsController::class, 'views'], $authorOrAdmin);
    }
}
