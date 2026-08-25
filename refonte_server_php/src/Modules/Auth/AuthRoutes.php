<?php

declare(strict_types=1);

namespace App\Modules\Auth;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

/**
 * Équivalent de src/modules/auth/auth.routes.ts. Monté sous /auth par Routes.php.
 * `register-author` n'est pas encore porté (dépend du module Authors/KYC).
 */
final class AuthRoutes
{
    public static function register(Router $router): void
    {
        $router->post('/register', [AuthController::class, 'register']);
        $router->post('/login', [AuthController::class, 'login']);
        // Sans authentification : le refresh token en tient lieu.
        $router->post('/refresh', [AuthController::class, 'refresh']);
        $router->post('/logout', [AuthController::class, 'logout']);
        $router->get('/me', [AuthController::class, 'me'], [AuthMiddleware::requireAuth(...)]);
    }
}
