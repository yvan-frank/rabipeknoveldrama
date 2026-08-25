<?php

declare(strict_types=1);

namespace App\Utils;

use RuntimeException;

/**
 * Équivalent du ZodError intercepté par error.middleware.ts : porte les
 * erreurs par champ, restituées telles quelles dans la réponse JSON 400.
 */
final class ValidationException extends RuntimeException
{
    /** @param array<string,list<string>> $fieldErrors */
    public function __construct(public readonly array $fieldErrors)
    {
        parent::__construct('Validation échouée');
    }
}
