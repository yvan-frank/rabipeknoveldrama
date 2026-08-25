<?php

declare(strict_types=1);

namespace App\Modules\Cart;

use App\Utils\ApiError;
use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/cart/cart.schema.ts.
 */
final class CartSchema
{
    public static function partIdParam(string $raw): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest('Identifiant de partie invalide');
        }
        return (int) $raw;
    }

    /** @param array<string,mixed> $body */
    public static function addPart(array $body): int
    {
        $partId = filter_var($body['partId'] ?? null, FILTER_VALIDATE_INT);
        if ($partId === false || $partId < 1) {
            throw new ValidationException(['partId' => ['Doit être un entier positif']]);
        }
        return $partId;
    }
}
