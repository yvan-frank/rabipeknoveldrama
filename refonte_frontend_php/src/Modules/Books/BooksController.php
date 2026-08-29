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
            'description' => 'Parcourez le catalogue complet de romans et drames africains disponibles sur RabipekNovel.',
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

        $data = $book['data'] ?? null;

        View::render('livres.show', [
            'book' => $data,
            'description' => $data !== null ? self::metaDescription($data) : null,
            'ogImage' => $data['cover'] ?? null,
            'jsonLd' => $data !== null ? self::bookJsonLd($data) : null,
        ], ($data['title'] ?? 'Livre') . ' | RabipekNovel');
    }

    /** @param array<string,mixed> $book */
    private static function metaDescription(array $book): ?string
    {
        $resume = is_string($book['resume'] ?? null) ? trim(strip_tags($book['resume'])) : '';
        if ($resume === '') {
            return null;
        }
        return mb_strlen($resume) > 160 ? mb_substr($resume, 0, 157) . '…' : $resume;
    }

    /** @param array<string,mixed> $book schema.org/Book — https://schema.org/Book */
    private static function bookJsonLd(array $book): string
    {
        $isFree = (bool) ($book['isFree'] ?? false);
        $isPromotion = (bool) ($book['isPromotion'] ?? false);
        $price = $isFree ? 0 : ($isPromotion ? ($book['promotionPrice'] ?? 0) : ($book['price'] ?? 0));

        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'Book',
            'name' => $book['title'] ?? null,
            'image' => $book['cover'] ?? null,
            'description' => self::metaDescription($book),
            'datePublished' => $book['datePub'] ?? null,
            'genre' => $book['category']['name'] ?? null,
            'author' => isset($book['author']['name']) ? ['@type' => 'Person', 'name' => $book['author']['name']] : null,
            'offers' => [
                '@type' => 'Offer',
                'price' => $price,
                'priceCurrency' => 'XAF',
                'availability' => 'https://schema.org/InStock',
            ],
        ];

        return json_encode(array_filter($jsonLd, static fn ($v) => $v !== null), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
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
