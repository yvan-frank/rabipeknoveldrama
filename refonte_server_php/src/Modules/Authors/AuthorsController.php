<?php

declare(strict_types=1);

namespace App\Modules\Authors;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/authors/authors.controller.ts.
 */
final class AuthorsController
{
    public static function getMyKyc(Request $request): void
    {
        Response::success(AuthorsService::getMyKyc((int) $request->user['authorId']));
    }

    public static function submitKyc(Request $request): void
    {
        $input = AuthorsSchema::kyc($request->body);
        Response::success(AuthorsService::submitKyc((int) $request->user['authorId'], $input));
    }

    public static function listForKycReview(Request $request): void
    {
        Response::success(AuthorsService::listAuthorsForKycReview());
    }

    public static function setKycVerification(Request $request): void
    {
        $authorId = AuthorsSchema::authorIdParam($request->params['authorId']);
        $verified = AuthorsSchema::kycVerification($request->body);
        Response::success(AuthorsService::setAuthorKycVerification($authorId, $verified));
    }

    public static function getKycBypassPolicy(Request $request): void
    {
        Response::success(AuthorsService::getAuthorKycBypassPolicy());
    }

    public static function setKycBypassPolicy(Request $request): void
    {
        $enabled = AuthorsSchema::kycBypass($request->body);
        Response::success(AuthorsService::setAuthorKycBypassPolicy($enabled));
    }
}
