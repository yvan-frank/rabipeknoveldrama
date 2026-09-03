<?php

declare(strict_types=1);

namespace App\Modules\Narration;

use App\Http\Request;
use App\Http\Response;

final class NarrationController
{
    public static function generate(Request $request): void
    {
        $chapterId = NarrationSchema::idParam($request->params['id']);
        $input = NarrationSchema::generate($request->body);
        $narration = NarrationService::requestNarration($chapterId, $request->user ?? [], $input['voice'], $input['speed']);
        Response::success($narration, 202);
    }

    public static function status(Request $request): void
    {
        $chapterId = NarrationSchema::idParam($request->params['id']);
        Response::success(NarrationService::getNarration($chapterId, $request->user ?? []));
    }

    public static function cancel(Request $request): void
    {
        $chapterId = NarrationSchema::idParam($request->params['id']);
        Response::success(NarrationService::cancelNarration($chapterId, $request->user ?? []));
    }
}
