<?php

declare(strict_types=1);

namespace App\Modules\Categories;

use App\Http\Request;
use App\Http\Response;
use App\Lib\Database;

/**
 * Miroir de src/modules/categories/{categories.controller,categories.service}.ts.
 * Lecture publique uniquement, comme côté Node (écriture laissée en TODO,
 * pas de besoin identifié côté frontend).
 */
final class CategoriesController
{
    public static function list(Request $request): void
    {
        $stmt = Database::connection()->query(
            'SELECT id_category AS id, category_name AS name, description FROM category ORDER BY category_name ASC',
        );
        Response::success($stmt->fetchAll());
    }
}
