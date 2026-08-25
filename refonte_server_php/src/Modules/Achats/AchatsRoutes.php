<?php

declare(strict_types=1);

namespace App\Modules\Achats;

use App\Http\Router;
use App\Middleware\AuthMiddleware;

/**
 * Miroir de src/modules/achats/achats.routes.ts. Seul GET / est routé côté
 * Node (le reste — checkout/capture PayPal — n'existe qu'en commentaire TODO,
 * sans route ni schéma associé) ; ce scaffold n'invente pas de routes
 * absentes de la source.
 *
 * @todo Checkout/capture PayPal (POST /checkout, POST /capture/:orderId) —
 *   à écrire quand l'intégration PayPal sera spécifiée côté Node.
 */
final class AchatsRoutes
{
    public static function register(Router $router): void
    {
        $router->get('/', [AchatsController::class, 'list'], [AuthMiddleware::requireAuth(...)]);
    }
}
