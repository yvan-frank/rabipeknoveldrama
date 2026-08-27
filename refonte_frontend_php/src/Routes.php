<?php

declare(strict_types=1);

namespace App;

use App\Http\Router;
use App\Modules\Admin\AdminController;
use App\Modules\Auth\AuthController;
use App\Modules\Author\AuthorController;
use App\Modules\Books\BooksController;
use App\Modules\Dashboard\DashboardController;
use App\Modules\Drama\DramaController;
use App\Modules\Home\HomeController;
use App\Modules\StaticPages\StaticPagesController;

/**
 * Table des routes de pages — une entrée par dossier de
 * refonte_rabi_frontend/src/app/**\/page.tsx, avec le même chemin d'URL et
 * les mêmes segments dynamiques (:slug, :id, :numero).
 */
final class Routes
{
    public static function register(Router $router): void
    {
        // app/page.tsx
        $router->get('/', [new HomeController(), 'index']);

        // app/livres/**
        $router->get('/livres', [new BooksController(), 'index']);
        $router->get('/livres/:slug', [new BooksController(), 'show']);
        $router->get('/livres/:slug/chapitres/:numero', [new BooksController(), 'chapter']);

        // app/connexion, app/inscription
        $router->get('/connexion', [new AuthController(), 'login']);
        $router->get('/inscription', [new AuthController(), 'register']);

        // app/tableau-de-bord/**
        $router->get('/tableau-de-bord', [new DashboardController(), 'index']);

        // app/espace-auteur/**
        $router->get('/espace-auteur', [new AuthorController(), 'index']);
        $router->get('/espace-auteur/livres', [new AuthorController(), 'books']);
        $router->get('/espace-auteur/livres/nouveau', [new AuthorController(), 'newBook']);
        $router->get('/espace-auteur/livres/:id', [new AuthorController(), 'editBook']);
        $router->get('/espace-auteur/avis', [new AuthorController(), 'reviews']);
        $router->get('/espace-auteur/kyc', [new AuthorController(), 'kyc']);
        $router->get('/espace-auteur/parametres', [new AuthorController(), 'settings']);
        $router->get('/espace-auteur/revenus', [new AuthorController(), 'revenue']);
        $router->get('/espace-auteur/statistiques', [new AuthorController(), 'stats']);

        // app/administration/**
        $router->get('/administration', [new AdminController(), 'index']);

        // app/rabipek-drama
        $router->get('/rabipek-drama', [new DramaController(), 'index']);

        // Pages statiques / légales
        $router->get('/a-propos-de-nous', [new StaticPagesController(), 'about']);
        $router->get('/mentions-legales', [new StaticPagesController(), 'legalNotice']);
        $router->get('/politique-confidentialite', [new StaticPagesController(), 'privacyPolicy']);
        $router->get('/conditions-generales-de-vente', [new StaticPagesController(), 'termsOfSale']);
        $router->get('/maintenance', [new StaticPagesController(), 'maintenance']);
    }
}
