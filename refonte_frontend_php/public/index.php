<?php

declare(strict_types=1);

use App\App;
use App\Config\Env;
use App\Http\Request;
use App\Support\View;

require dirname(__DIR__) . '/vendor/autoload.php';

$rootDir = dirname(__DIR__);

Env::boot($rootDir);
View::boot($rootDir . '/resources/views');

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');

$request = Request::fromGlobals();

App::createRouter()->dispatch($request);
