<?php

declare(strict_types=1);

namespace App\Modules\Auth;

use App\Config\Env;
use App\Http\Request;
use App\Support\View;

/**
 * Équivalent de src/app/connexion/page.tsx et src/app/inscription/page.tsx.
 * Les formulaires eux-mêmes sont des îlots React (LoginForm/RegisterForm)
 * qui appellent l'API en direct — cette page ne fait que fournir le cadre
 * (titre, layout) et le point de montage.
 */
final class AuthController
{
    public function login(Request $request): void
    {
        View::render('auth.connexion', [
            'redirectTo' => $request->query['redirect'] ?? '/tableau-de-bord',
            'hideChrome' => true,
            'playStoreUrl' => Env::playStoreUrl(),
        ], 'Connexion | RabipekNovel');
    }

    public function register(Request $request): void
    {
        View::render('auth.inscription', [
            'hideChrome' => true,
            'playStoreUrl' => Env::playStoreUrl(),
        ], 'Inscription | RabipekNovel');
    }
}
