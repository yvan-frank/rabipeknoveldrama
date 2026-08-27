<?php

declare(strict_types=1);

/**
 * Routeur pour le serveur de dev intégré (`php -S localhost:8000 router.php`) :
 * sert les fichiers réels de public/ tels quels (images, build/ Vite, css),
 * et délègue tout le reste à index.php — équivalent du .htaccess en prod.
 */

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$file = __DIR__ . $path;

if ($path !== '/' && is_file($file)) {
    return false;
}

require __DIR__ . '/index.php';
