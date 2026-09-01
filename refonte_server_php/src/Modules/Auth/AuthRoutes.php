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
        $router->post('/google', [AuthController::class, 'google']);
        $router->post('/forgot-password', [AuthController::class, 'forgotPassword']);
        $router->post('/reset-password', [AuthController::class, 'resetPassword']);
        // Sans authentification : le refresh token en tient lieu.
        $router->post('/refresh', [AuthController::class, 'refresh']);
        $router->post('/logout', [AuthController::class, 'logout']);
        $router->get('/me', [AuthController::class, 'me'], [AuthMiddleware::requireAuth(...)]);
        $router->delete('/me', [AuthController::class, 'deleteMe'], [AuthMiddleware::requireAuth(...)]);
    }
}
