<?php

declare(strict_types=1);

namespace App\Modules\Books;

use App\Api\ApiClient;
use App\Config\Env;
use App\Http\Request;
use App\Http\Response;
use App\Support\View;

/**
 * Équivalent de src/app/livres/page.tsx et src/app/livres/[slug]/page.tsx.
 *
 * La lecture d'un chapitre (src/app/livres/[slug]/chapitres/[numero]/page.tsx)
 * n'est plus servie sur le web : cf. chapter() ci-dessous, qui renvoie vers
 * l'app mobile (refonte_rabi_mobile) au lieu de rendre le contenu.
 */
final class BooksController
{
    public function index(Request $request): void
    {
        $api = new ApiClient($request->sessionToken());
        $page = $api->get('books', $request->query);
        $data = $page['data'] ?? [];

        View::render('livres.index', [
            'books' => $data['items'] ?? $data,
            'total' => $data['total'] ?? count($data['items'] ?? $data),
            'page' => $data['page'] ?? 1,
            'pageSize' => $data['pageSize'] ?? 20,
            'query' => $request->query,
        ], 'Catalogue | RabipekNovel');
    }

    public function show(Request $request): void
    {
        $slug = $request->params['slug'];
        $api = new ApiClient($request->sessionToken());
        $book = $api->get('books/' . rawurlencode($slug));

        if ($book === null) {
            Response::notFound();
        }

        View::render('livres.show', [
            'book' => $book['data'] ?? null,
        ], ($book['data']['title'] ?? 'Livre') . ' | RabipekNovel');
    }

    /**
     * Ne rend plus le contenu du chapitre : la lecture est réservée à l'app
     * mobile. GET /books/:slug renvoie déjà `chapters[].{id,chapterNumber}`
     * (cf. curl de vérification), donc on résout le numéro d'URL en
     * chapterId sans appel API supplémentaire pour pointer le deep link
     * directement sur le bon chapitre.
     */
    public function chapter(Request $request): void
    {
        $slug = $request->params['slug'];
        $numero = $request->params['numero'];
        $api = new ApiClient($request->sessionToken());
        $book = $api->get('books/' . rawurlencode($slug));

        if ($book === null) {
            Response::notFound();
        }

        $chapterId = $this->resolveChapterId($book['data']['chapters'] ?? [], $numero);

        $deepLink = $chapterId !== null
            ? Env::mobileAppScheme() . '://book/' . rawurlencode($slug) . '/chapter/' . rawurlencode((string) $chapterId)
            : Env::mobileAppScheme() . '://book/' . rawurlencode($slug);

        View::render('livres.chapitre', [
            'book' => $book['data'] ?? null,
            'numero' => $numero,
            'deepLink' => $deepLink,
            'playStoreUrl' => Env::playStoreUrl(),
            'appStoreUrl' => Env::appStoreUrl(),
            'hideChrome' => true,
            'noindex' => true,
        ], 'Continuer sur l\'app | RabipekNovel');
    }

    /**
     * @param list<array<string,mixed>> $chapters
     * Retourne null si le chapitre n'existe pas (fallback vers la fiche
     * livre dans chapter() ci-dessus).
     */
    private function resolveChapterId(array $chapters, string $numero): ?int
    {
        foreach ($chapters as $chapter) {
            if ((string) ($chapter['chapterNumber'] ?? '') === $numero) {
                return isset($chapter['id']) ? (int) $chapter['id'] : null;
            }
        }

        return null;
    }
}
