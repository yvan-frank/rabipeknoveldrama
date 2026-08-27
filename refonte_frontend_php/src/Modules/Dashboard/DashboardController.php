<?php

declare(strict_types=1);

namespace App\Modules\Dashboard;

use App\Http\Request;
use App\Http\Response;
use App\Middleware\AuthMiddleware;
use App\Support\View;

/** Équivalent de src/app/tableau-de-bord/{layout,page}.tsx. */
final class DashboardController
{
    public function index(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);

        // Ce tableau de bord (GET /users/moi/tableau-de-bord) est réservé au
        // rôle "user" côté API — un auteur/admin connecté est renvoyé vers
        // son propre espace plutôt que de recevoir une 403 depuis l'îlot,
        // même logique que le useEffect de redirection dans UserDashboard.tsx.
        if (($user['role'] ?? null) !== 'user') {
            Response::redirect($user['role'] === 'admin' ? '/administration' : '/espace-auteur');
        }

        View::render('dashboard.index', [
            'user' => $user,
            'noindex' => true,
            'hideChrome' => true,
        ], 'Mon espace | RabipekNovel');
    }
}
