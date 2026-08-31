<?php

declare(strict_types=1);

namespace App\Modules\Dashboard;

use App\Http\Request;
use App\Support\View;

/**
 * Équivalent de src/app/tableau-de-bord/{layout,page}.tsx. La garde de page
 * (session valide + rôle user) est faite côté client par l'îlot Dashboard
 * (cf. frontend-react/src/lib/useRequireAuth.ts) : PHP ne peut plus lire le
 * jeton de session (localStorage) au moment du rendu initial de la page.
 */
final class DashboardController
{
    public function index(Request $request): void
    {
        View::render('dashboard.index', [
            'noindex' => true,
            'hideChrome' => true,
        ], 'Mon espace | RabipekNovel');
    }
}
