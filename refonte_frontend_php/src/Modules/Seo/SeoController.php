<?php

declare(strict_types=1);

namespace App\Modules\Seo;

use App\Api\ApiClient;
use App\Config\Env;
use App\Http\Request;
use App\Http\Response;
use App\Support\View;

/**
 * robots.txt + sitemap.xml — pas d'équivalent Next.js (générés statiquement
 * là-bas, cf. refonte_rabi_frontend/src/app/{robots,sitemap}.ts absents de ce
 * scaffold) : servis ici comme des routes normales pour rester à jour avec le
 * catalogue de livres sans étape de build séparée.
 */
final class SeoController
{
    // Chemins jamais utiles à un moteur de recherche : connexion/inscription
    // (utilitaires, pas de contenu), tableau-de-bord/espace-auteur/administration
    // (privés, déjà noindex — cf. contrôleurs respectifs), maintenance (état
    // temporaire), et la "lecture" de chapitre qui ne fait que rediriger vers
    // l'app mobile (cf. BooksController::chapter).
    private const DISALLOWED_PATHS = [
        '/connexion',
        '/inscription',
        '/tableau-de-bord',
        '/espace-auteur',
        '/administration',
        '/maintenance',
    ];

    public function robots(Request $request): void
    {
        $lines = ['User-agent: *', 'Allow: /'];
        foreach (self::DISALLOWED_PATHS as $path) {
            $lines[] = "Disallow: {$path}";
        }
        $lines[] = 'Disallow: /*/chapitres/*';
        $lines[] = '';
        $lines[] = 'Sitemap: ' . Env::siteUrl() . '/sitemap.xml';

        Response::text(implode("\n", $lines) . "\n");
    }

    public function sitemap(Request $request): void
    {
        $siteUrl = Env::siteUrl();

        $staticEntries = [
            ['loc' => '/', 'changefreq' => 'daily', 'priority' => '1.0'],
            ['loc' => '/livres', 'changefreq' => 'daily', 'priority' => '0.8'],
            ['loc' => '/rabipek-drama', 'changefreq' => 'weekly', 'priority' => '0.6'],
            ['loc' => '/a-propos-de-nous', 'changefreq' => 'monthly', 'priority' => '0.3'],
            ['loc' => '/mentions-legales', 'changefreq' => 'yearly', 'priority' => '0.1'],
            ['loc' => '/politique-confidentialite', 'changefreq' => 'yearly', 'priority' => '0.1'],
            ['loc' => '/conditions-generales-de-vente', 'changefreq' => 'yearly', 'priority' => '0.1'],
            ['loc' => '/conditions-utilisation', 'changefreq' => 'yearly', 'priority' => '0.1'],
        ];

        $bookEntries = [];
        $api = new ApiClient();
        $page = 1;
        do {
            $result = $api->get('books', ['page' => $page, 'pageSize' => 100]);
            $items = $result['data']['items'] ?? [];
            foreach ($items as $book) {
                if (!isset($book['slug'])) {
                    continue;
                }
                $bookEntries[] = [
                    'loc' => '/livres/' . rawurlencode($book['slug']),
                    'lastmod' => is_string($book['datePub'] ?? null) ? substr($book['datePub'], 0, 10) : null,
                    'changefreq' => 'weekly',
                    'priority' => '0.7',
                ];
            }
            $total = $result['data']['total'] ?? 0;
            $pageSize = $result['data']['pageSize'] ?? 100;
            $page++;
        } while ($items !== [] && $page <= (int) ceil($total / max($pageSize, 1)));

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ([...$staticEntries, ...$bookEntries] as $entry) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . View::e($siteUrl . $entry['loc']) . '</loc>' . "\n";
            if (!empty($entry['lastmod'])) {
                $xml .= '    <lastmod>' . View::e($entry['lastmod']) . '</lastmod>' . "\n";
            }
            $xml .= '    <changefreq>' . $entry['changefreq'] . '</changefreq>' . "\n";
            $xml .= '    <priority>' . $entry['priority'] . '</priority>' . "\n";
            $xml .= '  </url>' . "\n";
        }

        $xml .= '</urlset>' . "\n";

        Response::xml($xml);
    }
}
