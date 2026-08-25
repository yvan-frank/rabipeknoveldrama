<?php

declare(strict_types=1);

namespace App\Utils;

use App\Config\Env;
use App\Http\Response;
use App\Lib\Logger;
use Throwable;

/**
 * Équivalent de src/middlewares/error.middleware.ts. Appelé depuis le
 * try/catch unique de public/index.php (pas de next(err) à chaîner en PHP
 * synchrone — un seul point d'entrée suffit).
 */
final class ErrorHandler
{
    public static function handle(Throwable $error): never
    {
        if ($error instanceof ValidationException) {
            Response::json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $error->fieldErrors,
            ], 400);
        }

        if ($error instanceof ApiError) {
            $payload = ['success' => false, 'message' => $error->getMessage()];
            if ($error->details !== null) {
                $payload['errors'] = $error->details;
            }
            Response::json($payload, $error->statusCode);
        }

        Logger::error('Erreur non gérée', [
            'error' => $error->getMessage(),
            'exception' => $error::class,
        ]);

        Response::json([
            'success' => false,
            'message' => 'Erreur interne du serveur',
            ...(Env::isProduction() ? [] : ['stack' => $error->getTraceAsString()]),
        ], 500);
    }

    public static function notFound(string $method, string $path): never
    {
        Response::json([
            'success' => false,
            'message' => "Route introuvable : {$method} {$path}",
        ], 404);
    }
}
