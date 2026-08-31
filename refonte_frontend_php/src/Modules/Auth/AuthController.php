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
            'noindex' => true,
            'playStoreUrl' => Env::playStoreUrl(),
            'googleClientId' => Env::googleClientIdWeb(),
        ], 'Connexion | RabipekNovel');
    }

    public function register(Request $request): void
    {
        View::render('auth.inscription', [
            'hideChrome' => true,
            'noindex' => true,
            'playStoreUrl' => Env::playStoreUrl(),
            'googleClientId' => Env::googleClientIdWeb(),
        ], 'Inscription | RabipekNovel');
    }

    /**
     * Chemin web de suppression de compte, exigé par Google Play même sans
     * l'app installée (cf. réglage "Sécurité des données" de la fiche Store)
     * — même effet que le bouton mobile, via le même endpoint API. La garde
     * de page et l'affichage de l'identité connectée sont gérés côté client
     * par l'îlot DeleteMyAccountButton (cf. useRequireAuth.ts) : PHP ne peut
     * plus lire le jeton de session (localStorage) au moment du rendu initial.
     */
    public function deleteAccount(Request $request): void
    {
        View::render('auth.supprimer-compte', [
            'noindex' => true,
        ], 'Supprimer mon compte | RabipekNovel');
    }
}
