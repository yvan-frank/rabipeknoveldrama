<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Rendu de templates PHP + layout global — équivalent natif du couple
 * app/layout.tsx + app/**\/page.tsx : chaque page ne renvoie que son
 * contenu (`view()`), qui est ensuite injecté dans resources/views/layout.php
 * (chrome commun : header, footer, script anti-flash du thème).
 */
final class View
{
    private static string $viewsDir;

    public static function boot(string $viewsDir): void
    {
        self::$viewsDir = rtrim($viewsDir, '/');
    }

    /**
     * @param array<string,mixed> $data
     */
    public static function render(string $template, array $data = [], string $title = 'RabipekNovel'): never
    {
        $content = self::capture($template, $data);
        $layoutData = ['content' => $content, 'title' => $title] + $data;

        \App\Http\Response::html(self::capture('layout', $layoutData));
    }

    /** @param array<string,mixed> $data */
    private static function capture(string $template, array $data): string
    {
        $path = self::$viewsDir . '/' . str_replace('.', '/', $template) . '.php';
        if (!is_file($path)) {
            throw new \RuntimeException("Vue introuvable : {$template} ({$path})");
        }

        extract($data, EXTR_SKIP);
        ob_start();
        require $path;
        return (string) ob_get_clean();
    }

    /**
     * Échappement HTML par défaut pour tout ce qui vient de l'API ou de
     * l'utilisateur — équivalent du comportement par défaut de JSX.
     */
    public static function e(?string $value): string
    {
        return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
    }

    /**
     * Sérialise des props pour un îlot React monté côté client — cf.
     * partials/island.php et frontend-react/src/main.tsx.
     *
     * @param array<string,mixed> $props
     * @param string $skeleton HTML brut affiché tant que React n'a pas
     *   hydraté le point de montage (remplacé automatiquement au premier
     *   root.render, cf. main.tsx) — jamais échappé, donc réservé à un
     *   balisage statique écrit à la main dans nos vues, jamais à une donnée
     *   dynamique/utilisateur.
     */
    public static function island(string $component, array $props = [], string $skeleton = ''): string
    {
        $encoded = $props === [] ? '{}' : json_encode($props, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $json = htmlspecialchars($encoded ?: '{}', ENT_QUOTES, 'UTF-8');
        return sprintf(
            '<div data-island="%s" data-props="%s">%s</div>',
            self::e($component),
            $json,
            $skeleton
        );
    }
}
