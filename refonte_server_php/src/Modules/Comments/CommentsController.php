<?php

declare(strict_types=1);

namespace App\Modules\Comments;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/comments/comments.controller.ts.
 */
final class CommentsController
{
    public static function listBookReviews(Request $request): void
    {
        $bookId = CommentsSchema::bookIdParam($request->params['bookId']);
        Response::success(CommentsService::listBookReviews($bookId));
    }

    public static function upsertBookReview(Request $request): void
    {
        $bookId = CommentsSchema::bookIdParam($request->params['bookId']);
        $input = CommentsSchema::upsertReview($request->body);
        Response::success(CommentsService::upsertBookReview($bookId, (int) $request->user['id'], $input), 201);
    }

    public static function replyToBookReview(Request $request): void
    {
        $commentId = CommentsSchema::commentIdParam($request->params['commentId']);
        $content = CommentsSchema::replyContent($request->body);
        Response::success(CommentsService::replyToBookReview($commentId, $content, $request->user ?? []));
    }

    public static function listChapterComments(Request $request): void
    {
        $chapterId = CommentsSchema::chapterIdParam($request->params['chapterId']);
        Response::success(CommentsService::listChapterComments($chapterId));
    }

    public static function createChapterComment(Request $request): void
    {
        $chapterId = CommentsSchema::chapterIdParam($request->params['chapterId']);
        $input = CommentsSchema::createChapterComment($request->body);
        Response::success(CommentsService::createChapterComment($chapterId, (int) $request->user['id'], $input), 201);
    }

    public static function deleteChapterComment(Request $request): void
    {
        $commentId = CommentsSchema::commentIdParam($request->params['commentId']);
        CommentsService::deleteChapterComment($commentId, (int) $request->user['id']);
        Response::success(null);
    }
}
