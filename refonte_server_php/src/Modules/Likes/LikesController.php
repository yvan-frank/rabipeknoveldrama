<?php

declare(strict_types=1);

namespace App\Modules\Likes;

use App\Http\Request;
use App\Http\Response;
use App\Utils\ApiError;

/**
 * Équivalent de src/modules/likes/likes.controller.ts.
 */
final class LikesController
{
    public static function toggle(Request $request): void
    {
        $raw = $request->params['bookId'];
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest('Identifiant de livre invalide');
        }

        Response::success(LikesService::toggleBookLike((int) $raw, (int) $request->user['id']));
    }
}
