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
    public static function update(array $body): array
    {
        $errors = [];
        $result = [];

        if (array_key_exists('name', $body)) {
            $name = is_string($body['name']) ? trim($body['name']) : '';
            if ($name === '' || mb_strlen($name) < 2) {
                $errors['name'] = ['Le nom doit contenir au moins 2 caractères'];
            } else {
                $result['name'] = mb_substr($name, 0, 150);
            }
        }

        if (array_key_exists('email', $body)) {
            $email = is_string($body['email']) ? trim($body['email']) : '';
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = ['Adresse e-mail invalide'];
            } else {
                $result['email'] = mb_substr($email, 0, 150);
            }
        }

        if (array_key_exists('isActive', $body)) {
            $result['isActive'] = (bool) $body['isActive'];
        }

        if (array_key_exists('isAdmin', $body)) {
            $result['isAdmin'] = (bool) $body['isAdmin'];
        }

        // Mot de passe optionnel — ne réinitialise que si une valeur non
        // vide est fournie ; hashé côté service (comme AuthService::register).
        if (array_key_exists('password', $body) && $body['password'] !== null && $body['password'] !== '') {
            $password = $body['password'];
            if (!is_string($password) || mb_strlen($password) < 8) {
                $errors['password'] = ['Le mot de passe doit contenir au moins 8 caractères'];
            } else {
                $result['password'] = $password;
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return $result;
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
