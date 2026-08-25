<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Handler générique pour les routes du scaffold pas encore portées : la
 * route existe et respecte le contrat (méthode, chemin, middlewares) mais
 * son contrôleur/service reste à écrire (cf. équivalent .controller.ts).
 * But : que le plan de routes soit complet et vérifiable dès le scaffold,
 * même avant d'avoir porté toute la logique métier.
 */
final class Stub
{
    public static function notImplemented(Request $request): void
    {
        Response::json([
            'success' => false,
            'message' => "Route reconnue mais pas encore implémentée : {$request->method} {$request->path}",
        ], 501);
    }
}
