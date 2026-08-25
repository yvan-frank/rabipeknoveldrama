<?php

declare(strict_types=1);

namespace App\Modules\Comments;

use App\Utils\ApiError;
use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/comments/comments.schema.ts.
 */
final class CommentsSchema
{
    public static function bookIdParam(string $raw): int
    {
        return self::positiveIntParam($raw, 'Identifiant de livre invalide');
    }

    public static function chapterIdParam(string $raw): int
    {
        return self::positiveIntParam($raw, 'Identifiant de chapitre invalide');
    }

    public static function commentIdParam(string $raw): int
    {
        return self::positiveIntParam($raw, 'Identifiant de commentaire invalide');
    }

    private static function positiveIntParam(string $raw, string $message): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest($message);
        }
        return (int) $raw;
    }

    /** @param array<string,mixed> $body */
    public static function upsertReview(array $body): array
    {
        $errors = [];

        $message = $body['message'] ?? null;
        if (!is_string($message) || mb_strlen($message) < 1 || mb_strlen($message) > 2000) {
            $errors['message'][] = 'Doit faire entre 1 et 2000 caractères';
        }

        $rating = filter_var($body['rating'] ?? null, FILTER_VALIDATE_INT);
        if ($rating === false || $rating < 1 || $rating > 5) {
            $errors['rating'][] = 'Doit être un entier entre 1 et 5';
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return ['message' => $message, 'rating' => $rating];
    }

    /** @param array<string,mixed> $body */
    public static function replyContent(array $body): string
    {
        $errors = [];
        $content = self::requireContent($body, $errors);
        if ($errors !== []) {
            throw new ValidationException($errors);
        }
        return $content;
    }

    /** @param array<string,mixed> $body */
    public static function createChapterComment(array $body): array
    {
        $errors = [];
        $content = self::requireContent($body, $errors);
        $parentId = self::optionalPositiveInt($body['parentId'] ?? null);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return ['content' => $content, 'parentId' => $parentId];
    }

    /** @param array<string,mixed> $body */
    private static function requireContent(array $body, array &$errors): string
    {
        $content = $body['content'] ?? null;
        if (!is_string($content) || mb_strlen($content) < 1 || mb_strlen($content) > 2000) {
            $errors['content'][] = 'Doit faire entre 1 et 2000 caractères';
            return '';
        }
        return $content;
    }

    private static function optionalPositiveInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        $int = filter_var($value, FILTER_VALIDATE_INT);
        return $int !== false && $int > 0 ? $int : null;
    }
}
