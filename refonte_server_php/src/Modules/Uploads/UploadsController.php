<?php

declare(strict_types=1);

namespace App\Modules\Uploads;

use App\Config\Env;
use App\Http\Request;
use App\Http\Response;
use App\Utils\ApiError;

/**
 * Équivalent de src/modules/uploads/uploads.controller.ts.
 */
final class UploadsController
{
    public static function uploadCover(Request $request): void
    {
        if ($request->file === null) {
            throw ApiError::badRequest('Aucune image reçue');
        }

        $url = Env::appUrl() . '/uploads/covers/' . $request->file['filename'];
        Response::success(['url' => $url], 201);
    }

    public static function uploadDocument(Request $request): void
    {
        if ($request->file === null) {
            throw ApiError::badRequest('Aucun document reçu');
        }

        $url = Env::appUrl() . '/uploads/documents/' . $request->file['filename'];
        Response::success(['url' => $url], 201);
    }
}
