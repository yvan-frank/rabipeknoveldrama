<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Config\Env;
use App\Http\Request;
use App\Utils\ApiError;
use App\Utils\Jwt;

/**
 * Équivalent de src/middlewares/auth.middleware.ts. Deux sources de jeton :
 * le cookie httpOnly (web) et l'en-tête Authorization: Bearer (mobile).
 */
final class AuthMiddleware
{
    private static function extractToken(Request $request): ?string
    {
        return $request->bearerToken() ?? ($request->cookies[Env::cookieName()] ?? null);
    }

    /** Handler prêt à l'emploi : middleware requireAuth. */
    public static function requireAuth(Request $request, callable $next): void
    {
        $token = self::extractToken($request);
        if ($token === null) {
            throw ApiError::unauthorized();
        }

        $request->user = Jwt::verify($token, Env::jwtSecret());
        $next($request);
    }

    /** Handler prêt à l'emploi : middleware optionalAuth. */
    public static function optionalAuth(Request $request, callable $next): void
    {
        $token = self::extractToken($request);
        if ($token !== null) {
            try {
                $request->user = Jwt::verify($token, Env::jwtSecret());
            } catch (ApiError) {
                // Token invalide/expiré : on ignore, route accessible en anonyme.
            }
        }
        $next($request);
    }

    /** Fabrique un middleware requireRole(...roles), comme côté Node. */
    public static function requireRole(string ...$roles): callable
    {
        return static function (Request $request, callable $next) use ($roles): void {
            if ($request->user === null) {
                throw ApiError::unauthorized();
            }
            if (!in_array($request->user['role'] ?? null, $roles, true)) {
                throw ApiError::forbidden();
            }
            $next($request);
        };
    }
}
