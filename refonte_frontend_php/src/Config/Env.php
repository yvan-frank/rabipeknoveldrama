<?php

declare(strict_types=1);

namespace App\Config;

use RuntimeException;

/**
 * Chargement des variables d'environnement — même convention que
 * refonte_server_php\Config\Env : "_PRO" surcharge la valeur de base quand
 * APP_ENV=production, pour garder un seul .env dev+prod.
 */
final class Env
{
    private static bool $booted = false;
    /** @var array<string,string> */
    private static array $values = [];

    public static function boot(string $rootDir): void
    {
        if (self::$booted) {
            return;
        }

        self::$values = self::parseDotEnv($rootDir . '/.env');
        self::applyProductionOverrides();

        self::$booted = true;
    }

    /** @return array<string,string> */
    private static function parseDotEnv(string $path): array
    {
        $values = [];

        foreach ($_SERVER as $key => $value) {
            if (is_string($value) && preg_match('/^[A-Z][A-Z0-9_]*$/', (string) $key)) {
                $values[$key] = $value;
            }
        }

        if (is_file($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                if (
                    (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))
                ) {
                    $value = substr($value, 1, -1);
                }
                if (!array_key_exists($key, $values)) {
                    $values[$key] = $value;
                }
            }
        }

        return $values;
    }

    private static function applyProductionOverrides(): void
    {
        if ((self::$values['APP_ENV'] ?? 'development') !== 'production') {
            return;
        }

        foreach (self::$values as $key => $value) {
            if (!str_ends_with($key, '_PRO') || $value === '') {
                continue;
            }
            self::$values[substr($key, 0, -4)] = $value;
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        return self::$values[$key] ?? $default;
    }

    public static function required(string $key): string
    {
        $value = self::$values[$key] ?? null;
        if ($value === null || $value === '') {
            throw new RuntimeException("Variable d'environnement requise manquante : {$key}");
        }
        return $value;
    }

    public static function isProduction(): bool
    {
        return self::get('APP_ENV', 'development') === 'production';
    }

    public static function apiUrl(): string
    {
        return rtrim(self::get('API_URL', 'http://localhost:4000/api') ?? '', '/');
    }

    public static function cookieName(): string
    {
        return self::get('COOKIE_NAME', 'rabipek_token') ?? 'rabipek_token';
    }

    public static function siteUrl(): string
    {
        return rtrim(self::get('SITE_URL', 'https://rabipeknovel.com') ?? '', '/');
    }

    public static function viteDevServerUrl(): string
    {
        return rtrim(self::get('VITE_DEV_SERVER_URL', 'http://localhost:5173') ?? '', '/');
    }

    // La lecture d'un chapitre n'est plus disponible sur le web : cf.
    // App\Modules\Books\BooksController::chapter() — la page renvoie vers
    // l'app mobile (refonte_rabi_mobile, scheme "rabipek").
    public static function mobileAppScheme(): string
    {
        return self::get('MOBILE_APP_SCHEME', 'rabipek') ?? 'rabipek';
    }

    public static function playStoreUrl(): string
    {
        return self::get('PLAY_STORE_URL', 'https://play.google.com/store/apps/details?id=com.frank00.rabipek')
            ?? 'https://play.google.com/store/apps/details?id=com.frank00.rabipek';
    }

    public static function appStoreUrl(): ?string
    {
        return self::get('APP_STORE_URL');
    }
}
