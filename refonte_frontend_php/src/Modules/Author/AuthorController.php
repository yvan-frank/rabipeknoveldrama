<?php

declare(strict_types=1);

namespace App\Modules\Author;

use App\Http\Request;
use App\Support\View;

/**
 * Équivalent de src/app/espace-auteur/**\/page.tsx. La garde de page (session
 * valide) est faite côté client par chaque îlot React de cet espace (cf.
 * frontend-react/src/lib/useRequireAuth.ts) : PHP ne peut plus lire le jeton
 * de session (localStorage) au moment du rendu initial de la page.
 */
final class AuthorController
{
    public function index(Request $request): void
    {
        View::render('author.index', ['noindex' => true], 'Espace auteur | RabipekNovel');
    }

    public function books(Request $request): void
    {
        View::render('author.livres.index', ['noindex' => true], 'Mes livres | RabipekNovel');
    }

    public function newBook(Request $request): void
    {
        View::render('author.livres.nouveau', ['noindex' => true], 'Nouveau livre | RabipekNovel');
    }

    public function editBook(Request $request): void
    {
        View::render('author.livres.show', [
            'bookId' => $request->params['id'],
            'noindex' => true,
        ], 'Modifier le livre | RabipekNovel');
    }

    public function reviews(Request $request): void
    {
        View::render('author.avis', ['noindex' => true], 'Avis | RabipekNovel');
    }

    public function kyc(Request $request): void
    {
        View::render('author.kyc', ['noindex' => true], 'Vérification KYC | RabipekNovel');
    }

    public function settings(Request $request): void
    {
        View::render('author.parametres', ['noindex' => true], 'Paramètres | RabipekNovel');
    }

    public function revenue(Request $request): void
    {
        View::render('author.revenus', ['noindex' => true], 'Revenus | RabipekNovel');
    }

    public function stats(Request $request): void
    {
        View::render('author.statistiques', ['noindex' => true], 'Statistiques | RabipekNovel');
    }
}
