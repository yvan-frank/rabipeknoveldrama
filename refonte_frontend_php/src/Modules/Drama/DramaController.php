<?php

declare(strict_types=1);

namespace App\Modules\Drama;

use App\Http\Request;
use App\Support\View;

/** Équivalent de src/app/rabipek-drama/page.tsx. */
final class DramaController
{
    public function index(Request $request): void
    {
        View::render('drama.index', [], 'RabipekDrama | RabipekNovel');
    }
}
