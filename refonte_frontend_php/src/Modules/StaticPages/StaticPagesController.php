<?php

declare(strict_types=1);

namespace App\Modules\StaticPages;

use App\Http\Request;
use App\Support\View;

/**
 * Équivalent des pages statiques/légales : a-propos-de-nous,
 * mentions-legales, politique-confidentialite, conditions-generales-de-vente,
 * maintenance.
 */
final class StaticPagesController
{
    public function about(Request $request): void
    {
        View::render('static.about', [], 'À propos | RabipekNovel');
    }

    public function legalNotice(Request $request): void
    {
        View::render('static.legal-notice', [], 'Mentions légales | RabipekNovel');
    }

    public function privacyPolicy(Request $request): void
    {
        View::render('static.privacy-policy', [], 'Politique de confidentialité | RabipekNovel');
    }

    public function termsOfSale(Request $request): void
    {
        View::render('static.terms-of-sale', [], 'CGV | RabipekNovel');
    }

    public function maintenance(Request $request): void
    {
        View::render('static.maintenance', [], 'Maintenance | RabipekNovel');
    }
}
