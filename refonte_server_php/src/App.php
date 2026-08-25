<?php

declare(strict_types=1);

namespace App;

use App\Http\Request;
use App\Http\Response;
use App\Http\Router;

/**
 * Équivalent de src/app.ts (createApp) : construit l'arbre de routes complet
 * (health check + /api/*) et l'expose pour dispatch. La construction est
 * séparée de public/index.php pour rester testable, comme côté Node.
 */
final class App
{
    public static function createRouter(): Router
    {
        $router = new Router();

        $router->get('/health', static function (Request $request): void {
            Response::json(['success' => true, 'status' => 'ok']);
        });

        $router->mount('/api', Routes::register(...));

        return $router;
    }
}
