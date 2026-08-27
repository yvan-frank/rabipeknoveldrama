<?php

declare(strict_types=1);

namespace App\Modules\Admin;

use App\Http\Request;
use App\Http\Response;
use App\Middleware\AuthMiddleware;
use App\Support\View;

/** Équivalent de src/app/administration/{layout,page}.tsx. */
final class AdminController
{
    public function index(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);

        // GET /users/administration/tableau-de-bord est réservé au rôle
        // "admin" côté API — un utilisateur/auteur connecté est renvoyé vers
        // son propre espace, même logique que le useEffect de redirection
        // dans AdminDashboard.tsx.
        if (($user['role'] ?? null) !== 'admin') {
            Response::redirect($user['role'] === 'author' ? '/espace-auteur' : '/tableau-de-bord');
        }

        View::render('admin.index', [
            'noindex' => true,
            'hideChrome' => true,
        ], 'Administration | RabipekNovel');
    }
}
