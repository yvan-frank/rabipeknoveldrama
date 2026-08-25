<?php

declare(strict_types=1);

use App\App;
use App\Config\Cors;
use App\Config\Env;
use App\Http\Request;
use App\Lib\Logger;
use App\Utils\ErrorHandler;

require dirname(__DIR__) . '/vendor/autoload.php';

$rootDir = dirname(__DIR__);

try {
    Env::boot($rootDir);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

// Équivalent de helmet({ crossOriginResourcePolicy: 'cross-origin' }) : les
// images uploadées doivent rester chargeables depuis l'origine du frontend.
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cross-Origin-Resource-Policy: cross-origin');
header('Referrer-Policy: strict-origin-when-cross-origin');

Cors::apply();

$request = Request::fromGlobals();
Logger::info('request', ['method' => $request->method, 'path' => $request->path]);

try {
    App::createRouter()->dispatch($request);
} catch (Throwable $error) {
    ErrorHandler::handle($error);
}
