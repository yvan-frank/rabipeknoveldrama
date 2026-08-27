<?php

declare(strict_types=1);

namespace App;

use App\Http\Router;

/**
 * Construit l'arbre de routes de pages — équivalent de la construction de
 * l'App Router Next.js (src/app/**), mais déclaré explicitement puisqu'il
 * n'y a pas de convention par système de fichiers ici.
 */
final class App
{
    public static function createRouter(): Router
    {
        $router = new Router();
        Routes::register($router);
        return $router;
    }
}
