<?php

declare(strict_types=1);

namespace App\Modules\Categories;

use App\Http\Router;

final class CategoriesRoutes
{
    public static function register(Router $router): void
    {
        $router->get('/', [CategoriesController::class, 'list']);
    }
}
