<?php

declare(strict_types=1);

namespace App\Modules\Admin;

use App\Http\Request;
use App\Support\View;

/**
 * Équivalent de src/app/administration/{layout,page}.tsx. La garde de page
 * (session valide + rôle admin) est faite côté client par l'îlot AdminPanel
 * (cf. frontend-react/src/lib/useRequireAuth.ts) : PHP ne peut plus lire le
 * jeton de session (localStorage) au moment du rendu initial de la page.
 */
final class AdminController
{
    public function index(Request $request): void
    {
        View::render('admin.index', [
            'noindex' => true,
            'hideChrome' => true,
        ], 'Administration | RabipekNovel');
    }
}
