<?php

declare(strict_types=1);

namespace App\Modules\BookParts;

use App\Utils\ApiError;
use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/book-parts/book-parts.schema.ts.
 */
final class BookPartsSchema
{
    public static function idParam(string $raw): int
    {
        return self::positiveIntParam($raw, 'Identifiant de partie invalide');
    }

    public static function bookIdParam(string $raw): int
    {
        return self::positiveIntParam($raw, 'Identifiant de livre invalide');
    }

    private static function positiveIntParam(string $raw, string $message): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest($message);
        }
        return (int) $raw;
    }

    /** @param array<string,mixed> $body */
    public static function create(array $body): array
    {
        $errors = [];

        $bookId = self::requireInt($body, 'bookId', 1, $errors);
        $title = self::requireTrimmedString($body, 'title', 1, 255, 'Le titre de la partie est requis', $errors);
        $partNumber = self::requireInt($body, 'partNumber', 1, $errors);
        $price = self::requireInt($body, 'price', 0, $errors);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return [
            'bookId' => $bookId,
            'title' => $title,
            'partNumber' => $partNumber,
            'description' => self::optionalTrimmedString($body['description'] ?? null, 5000),
            'price' => $price,
            'isFree' => self::boolOrDefault($body['isFree'] ?? null, false),
            'freeChapterCount' => self::intOrDefault($body['freeChapterCount'] ?? null, 0, 0),
        ];
    }

    // Mêmes champs que create(), tous optionnels, bookId exclu.
    /** @param array<string,mixed> $body */
    public static function update(array $body): array
    {
        $errors = [];
        $out = [];

        if (array_key_exists('title', $body)) {
            $out['title'] = self::requireTrimmedString($body, 'title', 1, 255, 'Le titre de la partie est requis', $errors);
        }
        if (array_key_exists('partNumber', $body)) {
            $out['partNumber'] = self::requireInt($body, 'partNumber', 1, $errors);
        }
        if (array_key_exists('description', $body)) {
            $out['description'] = self::optionalTrimmedString($body['description'], 5000);
        }
        if (array_key_exists('price', $body)) {
            $out['price'] = self::requireInt($body, 'price', 0, $errors);
        }
        if (array_key_exists('isFree', $body)) {
            $out['isFree'] = self::boolOrDefault($body['isFree'], false);
        }
        if (array_key_exists('freeChapterCount', $body)) {
            $out['freeChapterCount'] = self::intOrDefault($body['freeChapterCount'], 0, 0);
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return $out;
    }

    /** @param array<string,mixed> $body */
    private static function requireInt(array $body, string $field, int $min, array &$errors): int
    {
        $value = $body[$field] ?? null;
        $int = filter_var($value, FILTER_VALIDATE_INT);
        if ($int === false || $int < $min) {
            $errors[$field][] = "Doit être un entier supérieur ou égal à {$min}";
            return 0;
        }
        return $int;
    }

    /** @param array<string,mixed> $body */
    private static function requireTrimmedString(array $body, string $field, int $min, int $max, string $emptyMessage, array &$errors): string
    {
        $value = $body[$field] ?? null;
        $value = is_string($value) ? trim($value) : '';
        if (mb_strlen($value) < $min) {
            $errors[$field][] = $emptyMessage;
            return '';
        }
        if (mb_strlen($value) > $max) {
            $errors[$field][] = "Doit faire au plus {$max} caractère(s)";
            return '';
        }
        return $value;
    }

    private static function optionalTrimmedString(mixed $value, int $max): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $value = trim($value);
        if ($value === '') {
            return null;
        }
        return mb_strlen($value) > $max ? mb_substr($value, 0, $max) : $value;
    }

    private static function intOrDefault(mixed $value, int $default, int $min): int
    {
        $int = filter_var($value, FILTER_VALIDATE_INT);
        return ($int !== false && $int >= $min) ? $int : $default;
    }

    private static function boolOrDefault(mixed $value, bool $default): bool
    {
        if ($value === null) {
            return $default;
        }
        $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        return $bool ?? $default;
    }
}
