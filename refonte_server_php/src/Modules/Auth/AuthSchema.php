<?php

declare(strict_types=1);

namespace App\Modules\Auth;

/**
 * Équivalent de src/modules/auth/auth.schema.ts (registerSchema, loginSchema,
 * refreshTokenSchema). registerAuthorSchema n'est pas encore porté ici — le
 * module Authors (KYC, genres) n'est pas encore écrit côté PHP.
 */
final class AuthSchema
{
    public static function register(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    public static function login(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:1'],
        ];
    }

    public static function refreshToken(): array
    {
        return [
            'refreshToken' => ['required', 'string', 'min:20'],
        ];
    }

    public static function google(): array
    {
        return [
            'idToken' => ['required', 'string', 'min:20'],
        ];
    }
}
