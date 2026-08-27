<?php

declare(strict_types=1);

namespace App\Modules\Points;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

/**
 * Miroir de src/modules/points/points.routes.ts.
 */
final class PointsRoutes
{
    public static function register(Router $router): void
    {
        $auth = [AuthMiddleware::requireAuth(...)];

        $router->get('/balance', [PointsController::class, 'balance'], $auth);
        $router->get('/transactions', [PointsController::class, 'listTransactions'], $auth);
        $router->get('/earn/rewarded-ad', [PointsController::class, 'rewardedAdStatus'], $auth);
        $router->post('/earn/rewarded-ad', [PointsController::class, 'creditRewardedAd'], $auth);
        $router->get('/checkin', [PointsController::class, 'checkInStatus'], $auth);
        $router->post('/checkin', [PointsController::class, 'performCheckIn'], $auth);
        $router->get('/articles', [PointsController::class, 'articlesStatus'], $auth);
        $router->post('/articles/:articleId/read', [PointsController::class, 'markArticleRead'], $auth);
        $router->get('/reading-time', [PointsController::class, 'readingTimeStatus'], $auth);
        $router->post('/reading-time', [PointsController::class, 'addReadingTime'], $auth);
        $router->get('/chapter-unlock-cost', [PointsController::class, 'chapterUnlockCost'], $auth);
        $router->post('/chapters/:chapterId/unlock', [PointsController::class, 'unlockChapterWithPoints'], $auth);
    }
}
