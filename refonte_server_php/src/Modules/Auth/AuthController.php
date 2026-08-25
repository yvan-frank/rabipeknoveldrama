<?php

declare(strict_types=1);

namespace App\Modules\Auth;

use App\Config\Env;
use App\Http\Request;
use App\Http\Response;
use App\Utils\Validator;

/**
 * Équivalent de src/modules/auth/auth.controller.ts.
 */
final class AuthController
{
    private const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

    public static function register(Request $request): void
    {
        $input = Validator::validate($request->body, AuthSchema::register());
        $result = AuthService::register($input);

        Response::cookie(Env::cookieName(), $result['token'], self::COOKIE_MAX_AGE);
        Response::success([
            'user' => $result['user'],
            'accessToken' => $result['accessToken'],
            'refreshToken' => $result['refreshToken'],
        ], 201);
    }

    public static function login(Request $request): void
    {
        $input = Validator::validate($request->body, AuthSchema::login());
        $result = AuthService::login($input);

        Response::cookie(Env::cookieName(), $result['token'], self::COOKIE_MAX_AGE);
        Response::success([
            'user' => $result['user'],
            'accessToken' => $result['accessToken'],
            'refreshToken' => $result['refreshToken'],
        ]);
    }

    public static function logout(Request $request): void
    {
        $refreshToken = $request->body['refreshToken'] ?? null;
        AuthService::logout(is_string($refreshToken) ? $refreshToken : null);

        Response::clearCookie(Env::cookieName());
        Response::success(null);
    }

    public static function refresh(Request $request): void
    {
        $input = Validator::validate($request->body, AuthSchema::refreshToken());
        $result = AuthService::refreshAccessToken($input['refreshToken']);

        Response::success([
            'user' => $result['user'],
            'accessToken' => $result['accessToken'],
            'refreshToken' => $result['refreshToken'],
        ]);
    }

    public static function me(Request $request): void
    {
        Response::success(['user' => $request->user]);
    }
}
