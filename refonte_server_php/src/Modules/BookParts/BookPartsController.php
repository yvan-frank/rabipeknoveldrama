<?php

declare(strict_types=1);

namespace App\Modules\BookParts;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/book-parts/book-parts.controller.ts.
 */
final class BookPartsController
{
    public static function listByBook(Request $request): void
    {
        $bookId = BookPartsSchema::bookIdParam($request->params['bookId']);
        Response::success(BookPartsService::listBookParts($bookId));
    }

    public static function create(Request $request): void
    {
        $input = BookPartsSchema::create($request->body);
        Response::success(BookPartsService::createBookPart($input, $request->user ?? []), 201);
    }

    public static function update(Request $request): void
    {
        $id = BookPartsSchema::idParam($request->params['id']);
        $input = BookPartsSchema::update($request->body);
        Response::success(BookPartsService::updateBookPart($id, $input, $request->user ?? []));
    }

    public static function delete(Request $request): void
    {
        $id = BookPartsSchema::idParam($request->params['id']);
        BookPartsService::deleteBookPart($id, $request->user ?? []);
        Response::noContent();
    }
}
