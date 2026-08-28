<?php

declare(strict_types=1);

namespace App\Modules\Home;

use App\Api\ApiClient;
use App\Http\Request;
use App\Support\View;

/** Équivalent de src/app/page.tsx. */
final class HomeController
{
    public function index(Request $request): void
    {
        $api = new ApiClient($request->sessionToken());
        $topRated = $api->get('books/top-rated', ['limit' => 10]);
        $latest = $api->get('books', ['pageSize' => 10]);
        $categories = $api->get('categories');

        View::render('home.index', [
            'topRatedBooks' => $topRated['data'] ?? [],
            'latestBooks' => $latest['data']['items'] ?? [],
            'categories' => $categories['data'] ?? [],
        ], 'RabipekNovel — Livres africains en ligne');
    }
}
