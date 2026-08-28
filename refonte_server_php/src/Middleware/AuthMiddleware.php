<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Config\Env;
use App\Http\Request;
use App\Http\Response;
use App\Modules\Auth\AuthService;
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

    /**
     * Handler prêt à l'emploi : middleware guestOrAuth. Comme optionalAuth,
     * mais si aucun jeton valide n'est présent, crée à la volée un compte
     * invité (users.is_guest = 1) et pose son cookie de session — utilisé par
     * les routes de bonus/tâches (points) pour rester accessibles sans
     * inscription tout en gardant un userId réel pour les tables liées.
     */
    public static function guestOrAuth(Request $request, callable $next): void
    {
        $token = self::extractToken($request);
        if ($token !== null) {
            try {
                $request->user = Jwt::verify($token, Env::jwtSecret());
                $next($request);
                return;
            } catch (ApiError) {
                // Jeton invalide/expiré : on retombe sur la création d'un invité.
            }
        }

        $guestUser = AuthService::createGuest();
        $guestToken = Jwt::sign($guestUser, Env::jwtSecret(), Env::durationSeconds('JWT_EXPIRES_IN', '7d'));
        Response::cookie(Env::cookieName(), $guestToken, 7 * 24 * 60 * 60);
        // Le client mobile n'a pas de cookie jar : il récupère le jeton
        // invité via cet en-tête pour le renvoyer en Authorization: Bearer.
        if (!headers_sent()) {
            header('X-Guest-Token: ' . $guestToken);
        }

        $request->user = $guestUser;
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
