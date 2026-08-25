<?php

declare(strict_types=1);

namespace App\Modules\Uploads;

use App\Http\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\UploadMiddleware;

/**
 * Miroir de src/modules/uploads/uploads.routes.ts.
 *
 * Note : `/document` est sciemment PAS gardé par AuthorKycMiddleware — c'est
 * justement l'upload de la pièce d'identité qui permet de compléter le KYC.
 */
final class UploadsRoutes
{
    public static function register(Router $router): void
    {
        $authorOrAdmin = [AuthMiddleware::requireAuth(...), AuthMiddleware::requireRole('author', 'admin')];

        $router->post('/cover', [UploadsController::class, 'uploadCover'], [...$authorOrAdmin, UploadMiddleware::coverImage(...)]);
        $router->post('/document', [UploadsController::class, 'uploadDocument'], [...$authorOrAdmin, UploadMiddleware::identityDocument(...)]);
    }
}
