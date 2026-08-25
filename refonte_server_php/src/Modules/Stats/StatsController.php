<?php

declare(strict_types=1);

namespace App\Modules\Stats;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/stats/stats.controller.ts.
 */
final class StatsController
{
    public static function summary(Request $request): void
    {
        $bookId = StatsSchema::bookIdParam($request->params['id']);
        Response::success(StatsService::getBookStatsSummary($bookId, $request->user ?? []));
    }

    public static function views(Request $request): void
    {
        $bookId = StatsSchema::bookIdParam($request->params['id']);
        $query = StatsSchema::viewStatsQuery($request->query);
        Response::success(StatsService::getBookViewStats($bookId, $query, $request->user ?? []));
    }
}
