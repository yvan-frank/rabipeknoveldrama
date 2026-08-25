<?php

declare(strict_types=1);

namespace App\Modules\Chapters;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent des handlers de reading-progress.routes.ts. Monté sous /books :
 * /books/:id/reading-progress — `id` désigne ici le livre.
 */
final class ReadingProgressController
{
    public static function show(Request $request): void
    {
        $bookId = ChaptersSchema::bookIdParam($request->params['id']);
        $userId = (int) $request->user['id'];
        Response::success(ChaptersService::getReadingProgress($bookId, $userId));
    }

    public static function update(Request $request): void
    {
        $bookId = ChaptersSchema::bookIdParam($request->params['id']);
        $input = ChaptersSchema::readingProgress($request->body);
        $viewer = ['id' => (int) $request->user['id'], 'role' => (string) $request->user['role']];

        ChaptersService::setReadingProgress($bookId, $input['chapterNumber'], $input['progressPercent'], $viewer);
        Response::noContent();
    }
}
