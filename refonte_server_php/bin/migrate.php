<?php

declare(strict_types=1);

/**
 * Applique les fichiers .sql de database/migrations/ non encore exécutés,
 * dans l'ordre alphabétique (préfixe numérique, ex. 0001_..., 0002_...) —
 * équivalent maison de `prisma migrate deploy`, mais propre au serveur PHP :
 * jusqu'ici la base était possédée par refonte_server/prisma/schema.prisma
 * (Node), ce scaffold se contentait de s'y connecter. Le PHP a désormais son
 * propre schéma versionné (0001_initial_schema.sql = snapshot complet au
 * moment de la bascule) et son propre suivi des migrations appliquées
 * (table `_php_migrations`, distincte de `_prisma_migrations`).
 *
 * Usage : php bin/migrate.php   (ou : composer migrate)
 */

use App\Config\Env;
use App\Lib\Database;

require dirname(__DIR__) . '/vendor/autoload.php';
Env::boot(dirname(__DIR__));

/**
 * mysqldump produit un fichier avec plusieurs instructions ; PDO::exec() ne
 * supporte qu'une requête à la fois pour MySQL sans PDO::MYSQL_ATTR_MULTI_STATEMENTS
 * (non activé par Database::connection()) — on découpe donc sur `;` en fin
 * de ligne. Fiable ici car ce sont des fichiers DDL générés par mysqldump
 * (jamais de `;` littéral au milieu d'une définition de colonne).
 *
 * @return list<string>
 */
function splitSqlStatements(string $sql): array
{
    $statements = [];
    foreach (preg_split('/;\s*\n/', $sql) ?: [] as $chunk) {
        $statement = trim($chunk);
        if ($statement !== '') {
            $statements[] = $statement;
        }
    }
    return $statements;
}

$db = Database::connection();

$db->exec(
    'CREATE TABLE IF NOT EXISTS `_php_migrations` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `name` VARCHAR(255) NOT NULL,
        `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (`id`),
        UNIQUE KEY `_php_migrations_name_key` (`name`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
);

$applied = array_flip($db->query('SELECT `name` FROM `_php_migrations`')->fetchAll(PDO::FETCH_COLUMN));

$migrationsDir = dirname(__DIR__) . '/database/migrations';
$files = glob($migrationsDir . '/*.sql') ?: [];
sort($files, SORT_STRING);

$appliedCount = 0;
foreach ($files as $file) {
    $name = basename($file);
    if (isset($applied[$name])) {
        continue;
    }

    $sql = file_get_contents($file);
    if ($sql === false) {
        fwrite(STDERR, "Impossible de lire {$name}\n");
        exit(1);
    }

    echo "Application de {$name}...\n";
    try {
        // Pas de transaction ici : le DDL (CREATE/ALTER TABLE) déclenche un
        // commit implicite en MySQL quoi qu'il arrive — un beginTransaction()
        // autour n'apporterait donc aucune atomicité réelle, juste un
        // rollBack() qui échoue ensuite ("no active transaction").
        foreach (splitSqlStatements($sql) as $statement) {
            $db->exec($statement);
        }
        $db->prepare('INSERT INTO `_php_migrations` (`name`) VALUES (:name)')->execute(['name' => $name]);
    } catch (Throwable $e) {
        fwrite(STDERR, "Échec sur {$name} : {$e->getMessage()}\n");
        exit(1);
    }
    $appliedCount++;
}

echo $appliedCount > 0 ? "{$appliedCount} migration(s) appliquée(s).\n" : "Déjà à jour, rien à appliquer.\n";
