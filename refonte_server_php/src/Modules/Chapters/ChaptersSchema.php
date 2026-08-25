<?php

declare(strict_types=1);

namespace App\Modules\Chapters;

use App\Utils\ApiError;
use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/chapters/chapters.schema.ts.
 */
final class ChaptersSchema
{
    public static function idParam(string $raw): int
    {
        return self::positiveIntParam($raw, 'Identifiant de chapitre invalide');
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
        $partId = self::optionalNullableInt($body['partId'] ?? null);
        $title = self::requireString($body, 'title', 1, 255, $errors);
        $content = self::requireString($body, 'content', 1, null, $errors);
        $chapterNumber = self::requireInt($body, 'chapterNumber', 1, $errors);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return [
            'bookId' => $bookId,
            'partId' => $partId,
            'title' => $title,
            'content' => $content,
            'chapterNumber' => $chapterNumber,
            'extension' => self::extension($body['extension'] ?? null),
        ];
    }

    // Mêmes champs que create(), tous optionnels, bookId exclu (on ne
    // déplace jamais un chapitre vers un autre livre via update).
    /** @param array<string,mixed> $body */
    public static function update(array $body): array
    {
        $errors = [];
        $out = [];

        if (array_key_exists('partId', $body)) {
            $out['partId'] = self::optionalNullableInt($body['partId']);
        }
        if (array_key_exists('title', $body)) {
            $out['title'] = self::requireString($body, 'title', 1, 255, $errors);
        }
        if (array_key_exists('content', $body)) {
            $out['content'] = self::requireString($body, 'content', 1, null, $errors);
        }
        if (array_key_exists('chapterNumber', $body)) {
            $out['chapterNumber'] = self::requireInt($body, 'chapterNumber', 1, $errors);
        }
        if (array_key_exists('extension', $body)) {
            $out['extension'] = self::extension($body['extension']);
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return $out;
    }

    /** @param array<string,mixed> $body */
    public static function readingProgress(array $body): array
    {
        $errors = [];
        $chapterNumber = self::requireInt($body, 'chapterNumber', 1, $errors);

        $progressPercent = $body['progressPercent'] ?? null;
        if (!is_numeric($progressPercent) || (float) $progressPercent < 0 || (float) $progressPercent > 100) {
            $errors['progressPercent'][] = 'Doit être compris entre 0 et 100';
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return ['chapterNumber' => $chapterNumber, 'progressPercent' => (float) $progressPercent];
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
    private static function requireString(array $body, string $field, int $min, ?int $max, array &$errors): string
    {
        $value = $body[$field] ?? null;
        if (!is_string($value) || mb_strlen($value) < $min) {
            $errors[$field][] = "Doit faire au moins {$min} caractère(s)";
            return '';
        }
        if ($max !== null && mb_strlen($value) > $max) {
            $errors[$field][] = "Doit faire au plus {$max} caractère(s)";
            return '';
        }
        return $value;
    }

    private static function optionalNullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        $int = filter_var($value, FILTER_VALIDATE_INT);
        return $int !== false && $int > 0 ? $int : null;
    }

    /** @return array{introduction:?string}|null */
    private static function extension(mixed $raw): ?array
    {
        if (!is_array($raw)) {
            return null;
        }
        $introduction = $raw['introduction'] ?? null;
        return ['introduction' => is_string($introduction) && trim($introduction) !== '' ? $introduction : null];
    }
}
