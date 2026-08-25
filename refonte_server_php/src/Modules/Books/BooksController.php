<?php

declare(strict_types=1);

namespace App\Modules\Books;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/books/books.controller.ts.
 */
final class BooksController
{
    public static function list(Request $request): void
    {
        $query = BooksSchema::listQuery($request->query);
        Response::success(BooksService::listBooks($query));
    }

    public static function topRated(Request $request): void
    {
        $query = BooksSchema::topRatedQuery($request->query);
        Response::success(BooksService::getTopRatedBooks($query['limit']));
    }

    public static function show(Request $request): void
    {
        $slug = BooksSchema::slugParam($request->params['slug']);
        $viewerId = isset($request->user['id']) ? (int) $request->user['id'] : null;

        $viewContext = [
            'userId' => $viewerId,
            'ip' => $request->ip(),
            'userAgent' => $request->header('User-Agent'),
            'country' => $request->header('CF-IPCountry') ?? $request->header('X-Vercel-IP-Country'),
        ];

        Response::success(BooksService::getBookDetailForViewer($slug, $viewerId, $viewContext));
    }

    public static function listMine(Request $request): void
    {
        Response::success(BooksService::listMyBooks($request->user ?? []));
    }

    public static function listForAdmin(Request $request): void
    {
        Response::success(BooksService::listBooksForAdmin());
    }

    public static function moderate(Request $request): void
    {
        $id = BooksSchema::idParam($request->params['id']);
        $action = BooksSchema::moderate($request->body);
        Response::success(BooksService::moderateBook($id, $action));
    }

    public static function manage(Request $request): void
    {
        $id = BooksSchema::idParam($request->params['id']);
        Response::success(BooksService::getBookForManage($id, $request->user ?? []));
    }

    public static function grant(Request $request): void
    {
        $id = BooksSchema::idParam($request->params['id']);
        $input = BooksSchema::grantEmail($request->body);
        Response::success(BooksService::grantBookToReader($id, $input, $request->user ?? []), 201);
    }

    public static function create(Request $request): void
    {
        $input = BooksSchema::create($request->body);
        Response::success(BooksService::createBook($input, $request->user ?? []), 201);
    }

    public static function update(Request $request): void
    {
        $id = BooksSchema::idParam($request->params['id']);
        $input = BooksSchema::update($request->body);
        Response::success(BooksService::updateBook($id, $input, $request->user ?? []));
    }

    public static function delete(Request $request): void
    {
        $id = BooksSchema::idParam($request->params['id']);
        BooksSchema::assertDeleteConfirmation($request->body);
        BooksService::deleteBook($id, $request->user ?? []);
        Response::noContent();
    }
}
