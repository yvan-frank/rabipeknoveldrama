<?php

declare(strict_types=1);

namespace App\Modules\Chapters;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

/**
 * Miroir de src/modules/chapters/reading-progress.routes.ts. Monté sous
 * /books par Routes.php : /books/:id/reading-progress.
 */
final class ReadingProgressRoutes
{
    public static function register(Router $router): void
    {
        $router->get('/:id/reading-progress', [ReadingProgressController::class, 'show'], [AuthMiddleware::requireAuth(...)]);
        $router->put('/:id/reading-progress', [ReadingProgressController::class, 'update'], [AuthMiddleware::requireAuth(...)]);
    }
}
