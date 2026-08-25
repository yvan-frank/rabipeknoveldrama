<?php

declare(strict_types=1);

namespace App\Modules\Cart;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

/**
 * Miroir de src/modules/cart/cart.routes.ts. Toutes les routes exigent
 * requireAuth (le panier est toujours celui de l'utilisateur connecté).
 */
final class CartRoutes
{
    public static function register(Router $router): void
    {
        $auth = [AuthMiddleware::requireAuth(...)];

        $router->get('/', [CartController::class, 'list'], $auth);
        $router->post('/', [CartController::class, 'addPart'], $auth);
        $router->delete('/parties/:partId', [CartController::class, 'removePart'], $auth);
    }
}
