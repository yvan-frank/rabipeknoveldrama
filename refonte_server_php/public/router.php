<?php

declare(strict_types=1);

// Script de routage pour le serveur de dev intégré (`php -S`), qui ne lit
// pas .htaccess. Équivalent du `express.static('/uploads', ...)` +
// fallback vers l'app pour tout le reste : un fichier réel sous public/
// (ex. /uploads/xxx.jpg) est servi tel quel, tout le reste passe par index.php.
$requested = urldecode(parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?? '/');
$fullPath = __DIR__ . $requested;

if ($requested !== '/' && is_file($fullPath)) {
    return false;
}

require __DIR__ . '/index.php';
