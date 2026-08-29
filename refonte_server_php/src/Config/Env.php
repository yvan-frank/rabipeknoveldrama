<?php

declare(strict_types=1);

namespace App\Config;

use RuntimeException;

/**
 * Chargement/validation des variables d'environnement — équivalent natif de
 * src/config/env.ts (Node) : mêmes noms de variables, même convention "_PRO"
 * pour les surcharges de production, mêmes valeurs par défaut.
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
        self::assertRequired();

        self::$booted = true;
    }

    /** @return array<string,string> */
    private static function parseDotEnv(string $path): array
    {
        $values = [];

        // Les vraies variables d'environnement (Apache/Nginx, conteneur, CI)
        // priment toujours sur le fichier .env.
        foreach ($_SERVER as $key => $value) {
            if (is_string($value) && preg_match('/^[A-Z][A-Z0-9_]*$/', (string) $key)) {
                $values[$key] = $value;
            }
        }

        if (is_file($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) {
                    continue;
                }
                if (!str_contains($line, '=')) {
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
                // Ne pas écraser une vraie variable d'environnement déjà présente.
                if (!array_key_exists($key, $values)) {
                    $values[$key] = $value;
                }
            }
        }

        return $values;
    }

    // Même convention que Node : FOO_PRO remplace FOO quand APP_ENV=production.
    private static function applyProductionOverrides(): void
    {
        if ((self::$values['APP_ENV'] ?? 'development') !== 'production') {
            return;
        }

        foreach (self::$values as $key => $value) {
            if (!str_ends_with($key, '_PRO') || $value === '') {
                continue;
            }
            $baseKey = substr($key, 0, -4);
            self::$values[$baseKey] = $value;
        }
    }

    private static function assertRequired(): void
    {
        $missing = [];
        foreach (['DATABASE_URL', 'JWT_SECRET'] as $required) {
            if (trim(self::$values[$required] ?? '') === '') {
                $missing[] = $required;
            }
        }
        if (self::$values['JWT_SECRET'] ?? '') {
            if (strlen(self::$values['JWT_SECRET']) < 16) {
                $missing[] = 'JWT_SECRET (>= 16 caractères)';
            }
        }
        if ($missing !== []) {
            throw new RuntimeException('Variables d\'environnement invalides ou manquantes : ' . implode(', ', $missing));
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

    public static function bool(string $key, bool $default = false): bool
    {
        $value = self::$values[$key] ?? null;
        if ($value === null) {
            return $default;
        }
        return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    public static function int(string $key, int $default): int
    {
        $value = self::$values[$key] ?? null;
        return $value === null || $value === '' ? $default : (int) $value;
    }

    /** @return string[] */
    public static function list(string $key): array
    {
        $value = self::$values[$key] ?? '';
        if (trim($value) === '') {
            return [];
        }
        return array_values(array_filter(array_map('trim', explode(',', $value))));
    }

    public static function isProduction(): bool
    {
        return self::get('APP_ENV', 'development') === 'production';
    }

    public static function appUrl(): string
    {
        return self::get('APP_URL', 'http://localhost:4000') ?? 'http://localhost:4000';
    }

    public static function cookieName(): string
    {
        return self::get('COOKIE_NAME', 'rabipek_token') ?? 'rabipek_token';
    }

    // Sans "domain" explicite, setcookie() scope le cookie au host exact qui
    // répond — ici api.rabipeknovel.com (cf. APP_URL_PRO) — invisible pour
    // les pages PHP rendues sur rabipeknovel.com (refonte_frontend_php).
    // null en dev : localhost n'a pas de sous-domaine à couvrir, et un
    // "domain" qui ne matche pas l'hôte de la requête est simplement rejeté
    // par le navigateur (cookie jamais posé).
    public static function cookieDomain(): ?string
    {
        $value = self::get('COOKIE_DOMAIN', '');
        return $value !== '' ? $value : null;
    }

    public static function jwtSecret(): string
    {
        return self::required('JWT_SECRET');
    }

    /**
     * Audiences acceptées sur un idToken Google : le mobile et le web ont
     * chacun leur propre client OAuth "Web application" (cf.
     * refonte_rabi_mobile/.env.local GOOGLE_CLIENT_ID et
     * refonte_frontend_php/.env GOOGLE_CLIENT_ID), donc deux valeurs
     * possibles pour `aud`. Ni l'un ni l'autre n'est strictement requis pris
     * isolément — seul POST /auth/google échoue si aucun des deux n'est
     * configuré.
     * @return string[]
     */
    public static function googleClientIds(): array
    {
        return array_values(array_filter([
            self::get('GOOGLE_CLIENT_ID'),
            self::get('GOOGLE_CLIENT_ID_WEB'),
        ], static fn (?string $v): bool => $v !== null && $v !== ''));
    }

    // "7d", "15m", "3600" (secondes brutes), "1h" -> secondes.
    public static function durationSeconds(string $key, string $default): int
    {
        $raw = self::get($key, $default) ?? $default;
        if (preg_match('/^(\d+)(s|m|h|d)?$/', trim($raw), $matches) !== 1) {
            return (int) $raw;
        }
        $amount = (int) $matches[1];
        return match ($matches[2] ?? 's') {
            'm' => $amount * 60,
            'h' => $amount * 3600,
            'd' => $amount * 86400,
            default => $amount,
        };
    }

    /** @return array{driver:string,host:string,port:int,database:string,user:string,password:string} */
    public static function database(): array
    {
        $url = self::required('DATABASE_URL');
        $parts = parse_url($url);
        if ($parts === false || !isset($parts['host'], $parts['path'])) {
            throw new RuntimeException('DATABASE_URL invalide, format attendu : mysql://user:pass@host:port/db');
        }

        return [
            'driver' => 'mysql',
            'host' => $parts['host'],
            'port' => $parts['port'] ?? 3306,
            'database' => ltrim($parts['path'], '/'),
            'user' => $parts['user'] ?? '',
            'password' => $parts['pass'] ?? '',
        ];
    }
}
