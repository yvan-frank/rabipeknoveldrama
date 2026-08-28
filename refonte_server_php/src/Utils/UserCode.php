<?php

declare(strict_types=1);

namespace App\Utils;

/**
 * Identifiant utilisateur lisible dérivé de id_user (ex: 12 -> "0012"),
 * exposé côté API sous 'userCode' — utile notamment pour qu'un visiteur
 * invité (sans email) puisse s'identifier.
 */
final class UserCode
{
    private const MIN_DIGITS = 4;

    public static function format(int $id): string
    {
        return str_pad((string) $id, self::MIN_DIGITS, '0', STR_PAD_LEFT);
    }
}
