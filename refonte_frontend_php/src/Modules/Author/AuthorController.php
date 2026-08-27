<?php

declare(strict_types=1);

namespace App\Modules\Author;

use App\Http\Request;
use App\Middleware\AuthMiddleware;
use App\Support\View;

/** Équivalent de src/app/espace-auteur/**\/page.tsx. */
final class AuthorController
{
    public function index(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);
        View::render('author.index', ['user' => $user, 'noindex' => true], 'Espace auteur | RabipekNovel');
    }

    public function books(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);
        View::render('author.livres.index', ['user' => $user, 'noindex' => true], 'Mes livres | RabipekNovel');
    }

    public function newBook(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);
        View::render('author.livres.nouveau', ['user' => $user, 'noindex' => true], 'Nouveau livre | RabipekNovel');
    }

    public function editBook(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);
        View::render('author.livres.show', [
            'user' => $user,
            'bookId' => $request->params['id'],
            'noindex' => true,
        ], 'Modifier le livre | RabipekNovel');
    }

    public function reviews(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);
        View::render('author.avis', ['user' => $user, 'noindex' => true], 'Avis | RabipekNovel');
    }

    public function kyc(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);
        View::render('author.kyc', ['user' => $user, 'noindex' => true], 'Vérification KYC | RabipekNovel');
    }

    public function settings(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);
        View::render('author.parametres', ['user' => $user, 'noindex' => true], 'Paramètres | RabipekNovel');
    }

    public function revenue(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);
        View::render('author.revenus', ['user' => $user, 'noindex' => true], 'Revenus | RabipekNovel');
    }

    public function stats(Request $request): void
    {
        $user = AuthMiddleware::requireAuth($request);
        View::render('author.statistiques', ['user' => $user, 'noindex' => true], 'Statistiques | RabipekNovel');
    }
}
