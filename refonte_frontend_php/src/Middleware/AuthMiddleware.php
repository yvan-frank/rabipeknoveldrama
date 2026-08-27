<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Api\ApiClient;
use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent page-level des gardes client (useSession) des layouts
 * tableau-de-bord/espace-auteur/administration : sans session valide côté
 * API, on redirige vers /connexion plutôt que de rendre une page vide.
 */
final class AuthMiddleware
{
    /** @return array<string,mixed> l'utilisateur authentifié */
    public static function requireAuth(Request $request): array
    {
        $token = $request->sessionToken();
        $me = $token !== null ? (new ApiClient($token))->get('auth/me') : null;
        // GET /auth/me renvoie {success, data:{user:{...}}} — imbriqué sous
        // "user" (cf. AuthController::me côté API), pas directement l'objet.
        $user = $me['data']['user'] ?? null;

        if (!is_array($user)) {
            $redirect = urlencode($request->path);
            Response::redirect("/connexion?redirect={$redirect}");
        }

        return $user;
    }
}
