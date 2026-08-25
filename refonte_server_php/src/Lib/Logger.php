<?php

declare(strict_types=1);

namespace App\Lib;

/**
 * Logger minimal (équivalent de src/lib/logger.ts / pino). En développement,
 * écrit sur STDERR ; à terme, brancher un fichier de log ou un service
 * externe est une simple modification de la méthode write().
 */
final class Logger
{
    public static function info(string $message, array $context = []): void
    {
        self::write('INFO', $message, $context);
    }

    public static function warn(string $message, array $context = []): void
    {
        self::write('WARN', $message, $context);
    }

    public static function error(string $message, array $context = []): void
    {
        self::write('ERROR', $message, $context);
    }

    private static function write(string $level, string $message, array $context): void
    {
        $line = sprintf(
            '[%s] %s %s%s',
            date('c'),
            $level,
            $message,
            $context === [] ? '' : ' ' . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        );
        error_log($line);
    }
}
