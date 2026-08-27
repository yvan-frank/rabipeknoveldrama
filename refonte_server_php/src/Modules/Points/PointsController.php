<?php

declare(strict_types=1);

namespace App\Modules\Points;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/points/points.controller.ts.
 */
final class PointsController
{
    public static function balance(Request $request): void
    {
        Response::success(PointsService::getBalance((int) $request->user['id']));
    }

    public static function listTransactions(Request $request): void
    {
        $limit = PointsSchema::listTransactionsQuery($request->query);
        Response::success(PointsService::listTransactions((int) $request->user['id'], $limit));
    }

    public static function rewardedAdStatus(Request $request): void
    {
        Response::success(PointsService::getRewardedAdStatus((int) $request->user['id']));
    }

    public static function creditRewardedAd(Request $request): void
    {
        Response::success(PointsService::creditRewardedAd((int) $request->user['id']));
    }

    public static function checkInStatus(Request $request): void
    {
        Response::success(PointsService::getCheckInStatus((int) $request->user['id']));
    }

    public static function performCheckIn(Request $request): void
    {
        Response::success(PointsService::performCheckIn((int) $request->user['id']));
    }

    public static function articlesStatus(Request $request): void
    {
        Response::success(PointsService::getArticlesStatus((int) $request->user['id']));
    }

    public static function markArticleRead(Request $request): void
    {
        $articleId = PointsSchema::articleIdParam($request->params['articleId']);
        Response::success(PointsService::markArticleRead((int) $request->user['id'], $articleId));
    }

    public static function readingTimeStatus(Request $request): void
    {
        Response::success(PointsService::getReadingTimeStatus((int) $request->user['id']));
    }

    public static function addReadingTime(Request $request): void
    {
        $seconds = PointsSchema::addReadingTime($request->body);
        Response::success(PointsService::addReadingTime((int) $request->user['id'], $seconds));
    }

    public static function chapterUnlockCost(Request $request): void
    {
        Response::success(['cost' => PointsService::getChapterUnlockPointsCost()]);
    }

    public static function unlockChapterWithPoints(Request $request): void
    {
        $chapterId = PointsSchema::chapterIdParam($request->params['chapterId']);
        Response::success(PointsService::unlockChapterWithPoints((int) $request->user['id'], $chapterId), 201);
    }
}
