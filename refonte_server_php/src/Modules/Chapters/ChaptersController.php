<?php

declare(strict_types=1);

namespace App\Modules\Chapters;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/chapters/chapters.controller.ts (lecture,
 * création, mise à jour, suppression). Les handlers reading-progress vivent
 * dans ReadingProgressController, comme reading-progress.routes.ts côté Node.
 */
final class ChaptersController
{
    public static function listByBook(Request $request): void
    {
        $bookId = ChaptersSchema::bookIdParam($request->params['bookId']);
        Response::success(ChaptersService::listChaptersByBook($bookId));
    }

    public static function show(Request $request): void
    {
        $id = ChaptersSchema::idParam($request->params['id']);
        $viewer = self::viewer($request);
        Response::success(ChaptersService::getChapterForViewer($id, $viewer));
    }

    public static function manage(Request $request): void
    {
        $id = ChaptersSchema::idParam($request->params['id']);
        Response::success(ChaptersService::getChapterForManage($id, $request->user ?? []));
    }

    public static function create(Request $request): void
    {
        $input = ChaptersSchema::create($request->body);
        Response::success(ChaptersService::createChapter($input, $request->user ?? []), 201);
    }

    public static function update(Request $request): void
    {
        $id = ChaptersSchema::idParam($request->params['id']);
        $input = ChaptersSchema::update($request->body);
        Response::success(ChaptersService::updateChapter($id, $input, $request->user ?? []));
    }

    public static function delete(Request $request): void
    {
        $id = ChaptersSchema::idParam($request->params['id']);
        ChaptersService::deleteChapter($id, $request->user ?? []);
        Response::noContent();
    }

    /** @return array{id:int,role:string}|null */
    private static function viewer(Request $request): ?array
    {
        if ($request->user === null) {
            return null;
        }
        return ['id' => (int) $request->user['id'], 'role' => (string) $request->user['role']];
    }
}
