<?php

declare(strict_types=1);

namespace App\Lib;

use App\Config\Env;
use PDO;
use PDOException;

/**
 * Connexion PDO paresseuse et partagée — équivalent natif de src/lib/prisma.ts.
 * Le schéma reste celui de refonte_server/prisma/schema.prisma (mêmes tables,
 * mêmes noms de colonnes via les @map de Prisma) : ce scaffold ne le recrée
 * pas, il s'y connecte.
 */
final class Database
{
    private static ?PDO $connection = null;

    public static function connection(): PDO
    {
        if (self::$connection !== null) {
            return self::$connection;
        }

        $config = Env::database();
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $config['host'],
            $config['port'],
            $config['database'],
        );

        try {
            self::$connection = new PDO($dsn, $config['user'], $config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            Logger::error('Connexion base de données échouée', ['error' => $e->getMessage()]);
            throw $e;
        }

        return self::$connection;
    }
}
