<?php

declare(strict_types=1);

namespace App\Utils;

/**
 * Équivalent de src/utils/ownership.ts. $user est le tableau posé par
 * AuthMiddleware (payload JWT décodé : id, email, role, authorId?).
 */
final class Ownership
{
    /** @param array<string,mixed> $user */
    public static function assertAuthorOwnership(array $user, int $authorId): void
    {
        if (($user['role'] ?? null) === 'admin') {
            return;
        }
        if (($user['role'] ?? null) === 'author' && (int) ($user['authorId'] ?? 0) === $authorId) {
            return;
        }
        throw ApiError::forbidden("Vous n'êtes pas autorisé à modifier cette ressource");
    }
}
