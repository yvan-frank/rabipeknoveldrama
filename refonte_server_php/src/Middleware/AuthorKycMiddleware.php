<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Http\Request;
use App\Modules\Authors\AuthorsService;

/**
 * Équivalent de src/middlewares/authorKyc.middleware.ts. Bloque les actions
 * d'écriture (création/modification/suppression de livres et chapitres) tant
 * qu'un auteur n'a pas complété et fait vérifier son KYC. Un admin n'est
 * jamais concerné (rôle différent) ; un rôle 'user' n'atteint jamais ces
 * routes (déjà bloqué par requireRole('author','admin') en amont).
 */
final class AuthorKycMiddleware
{
    public static function requireAuthorKyc(Request $request, callable $next): void
    {
        if (($request->user['role'] ?? null) !== 'author') {
            $next($request);
            return;
        }

        AuthorsService::assertAuthorKycComplete((int) $request->user['authorId']);
        $next($request);
    }
}
