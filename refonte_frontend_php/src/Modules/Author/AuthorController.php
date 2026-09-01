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
 *
 * hideChrome + authorActive : chrome global du site remplacé par la coquille
 * dédiée (topbar + sidebar sombres, cf. resources/views/partials/author-shell-*.php).
 */
final class AuthorController
{
    public function index(Request $request): void
    {
        View::render('author.index', ['noindex' => true, 'hideChrome' => true, 'authorActive' => 'overview'], 'Espace auteur | RabipekNovel');
    }

    public function books(Request $request): void
    {
        View::render('author.livres.index', ['noindex' => true, 'hideChrome' => true, 'authorActive' => 'books'], 'Mes livres | RabipekNovel');
    }

    public function newBook(Request $request): void
    {
        View::render('author.livres.nouveau', ['noindex' => true, 'hideChrome' => true, 'authorActive' => 'books'], 'Nouveau livre | RabipekNovel');
    }

    public function editBook(Request $request): void
    {
        View::render('author.livres.show', [
            'bookId' => $request->params['id'],
            'noindex' => true,
            'hideChrome' => true,
            'authorActive' => 'books',
        ], 'Modifier le livre | RabipekNovel');
    }

    public function newChapter(Request $request): void
    {
        View::render('author.livres.chapitre', [
            'bookId' => $request->params['id'],
            'chapterId' => null,
            'noindex' => true,
            'hideChrome' => true,
            'authorActive' => 'books',
        ], 'Nouveau chapitre | RabipekNovel');
    }

    public function editChapter(Request $request): void
    {
        View::render('author.livres.chapitre', [
            'bookId' => $request->params['id'],
            'chapterId' => $request->params['chapterId'],
            'noindex' => true,
            'hideChrome' => true,
            'authorActive' => 'books',
        ], 'Modifier le chapitre | RabipekNovel');
    }

    public function reviews(Request $request): void
    {
        View::render('author.avis', ['noindex' => true, 'hideChrome' => true, 'authorActive' => 'reviews'], 'Avis | RabipekNovel');
    }

    public function kyc(Request $request): void
    {
        View::render('author.kyc', ['noindex' => true, 'hideChrome' => true, 'authorActive' => 'kyc'], 'Vérification KYC | RabipekNovel');
    }

    public function settings(Request $request): void
    {
        View::render('author.parametres', ['noindex' => true, 'hideChrome' => true, 'authorActive' => 'settings'], 'Paramètres | RabipekNovel');
    }

    public function revenue(Request $request): void
    {
        View::render('author.revenus', ['noindex' => true, 'hideChrome' => true, 'authorActive' => 'revenue'], 'Revenus | RabipekNovel');
    }

    public function stats(Request $request): void
    {
        View::render('author.statistiques', ['noindex' => true, 'hideChrome' => true, 'authorActive' => 'stats'], 'Statistiques | RabipekNovel');
    }
}
