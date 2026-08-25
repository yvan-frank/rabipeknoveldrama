<?php

declare(strict_types=1);

namespace App\Modules\Users;

use App\Utils\ApiError;
use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/users/users.schema.ts.
 */
final class UsersSchema
{
    /** @param array<string,mixed> $query */
    public static function listQuery(array $query): array
    {
        return [
            'page' => self::intOrDefault($query['page'] ?? null, 1, 1),
            'pageSize' => self::intOrDefault($query['pageSize'] ?? null, 20, 1, 100),
        ];
    }

    public static function idParam(string $raw): int
    {
        return self::positiveIntParam($raw, 'Identifiant utilisateur invalide');
    }

    public static function grantIdParam(string $raw): int
    {
        return self::positiveIntParam($raw, "Identifiant d'attribution invalide");
    }

    /** @param array<string,mixed> $body */
    public static function grantBook(array $body): array
    {
        $bookId = filter_var($body['bookId'] ?? null, FILTER_VALIDATE_INT);
        if ($bookId === false || $bookId < 1) {
            throw new ValidationException(['bookId' => ['Doit être un entier positif']]);
        }

        $note = $body['note'] ?? null;
        if (is_string($note)) {
            $note = trim($note);
            $note = $note !== '' ? mb_substr($note, 0, 500) : null;
        } else {
            $note = null;
        }

        return ['bookId' => $bookId, 'note' => $note];
    }

    private static function positiveIntParam(string $raw, string $message): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest($message);
        }
        return (int) $raw;
    }

    private static function intOrDefault(mixed $value, int $default, int $min, ?int $max = null): int
    {
        $int = filter_var($value, FILTER_VALIDATE_INT);
        if ($int === false || $int < $min) {
            return $default;
        }
        if ($max !== null && $int > $max) {
            return $max;
        }
        return $int;
    }
}
