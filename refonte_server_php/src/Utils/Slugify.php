<?php

declare(strict_types=1);

namespace App\Utils;

/**
 * Équivalent de src/utils/slugify.ts.
 */
final class Slugify
{
    public static function make(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $translit = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $value = $translit !== false ? $translit : $value;
        $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
        return trim($value, '-');
    }
}
