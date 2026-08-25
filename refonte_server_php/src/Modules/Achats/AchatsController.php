<?php

declare(strict_types=1);

namespace App\Modules\Achats;

use App\Http\Request;
use App\Http\Response;

final class AchatsController
{
    public static function list(Request $request): void
    {
        Response::success(AchatsService::listUserAchats((int) $request->user['id']));
    }
}
