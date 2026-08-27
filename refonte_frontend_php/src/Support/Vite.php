<?php

declare(strict_types=1);

namespace App\Support;

use App\Config\Env;

/**
 * Injection des assets des îlots React, façon plugin Vite officiel de
 * Laravel : en dev, on pointe vers le serveur Vite (HMR) ; en prod, on lit
 * public/build/.vite/manifest.json généré par `npm run build` dans
 * frontend-react/ pour émettre les fichiers hashés.
 */
final class Vite
{
    private const ENTRY = 'src/main.tsx';

    public static function tags(): string
    {
        $publicDir = dirname(__DIR__, 2) . '/public';
        $hotFile = $publicDir . '/hot';

        // public/hot n'existe que pendant `npm run dev` (écrit par le plugin
        // Vite custom dans frontend-react/vite.config.ts) : sa présence prime
        // sur un build de prod déjà généré, pour ne jamais masquer le HMR.
        if (!Env::isProduction() && is_file($hotFile)) {
            $devServer = trim((string) file_get_contents($hotFile)) ?: Env::viteDevServerUrl();
            return
                "<script type=\"module\" src=\"{$devServer}/@vite/client\"></script>\n" .
                "<script type=\"module\" src=\"{$devServer}/" . self::ENTRY . "\"></script>";
        }

        $manifestPath = $publicDir . '/build/.vite/manifest.json';
        if (!is_file($manifestPath)) {
            // Build pas encore générée : la page reste utilisable, seuls
            // les îlots interactifs ne s'hydratent pas.
            return '<!-- frontend-react: exécuter `npm run build` dans frontend-react/ -->';
        }

        $manifest = json_decode((string) file_get_contents($manifestPath), true);
        $entry = $manifest[self::ENTRY] ?? null;
        if ($entry === null) {
            return '<!-- frontend-react: entrée ' . self::ENTRY . ' absente du manifest -->';
        }

        $tags = [];
        foreach ($entry['css'] ?? [] as $cssFile) {
            $tags[] = '<link rel="stylesheet" href="/build/' . $cssFile . '">';
        }
        $tags[] = '<script type="module" src="/build/' . $entry['file'] . '"></script>';

        return implode("\n", $tags);
    }
}
