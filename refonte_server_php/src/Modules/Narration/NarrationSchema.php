<?php

declare(strict_types=1);

namespace App\Modules\Narration;

use App\Utils\ApiError;
use App\Utils\ValidationException;

final class NarrationSchema
{
    public static function idParam(string $raw): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest('Identifiant de chapitre invalide');
        }
        return (int) $raw;
    }

    /**
     * @param array<string,mixed> $body
     * @return array{voice:?string,speed:?float}
     */
    public static function generate(array $body): array
    {
        $errors = [];

        $voice = $body['voice'] ?? null;
        if ($voice !== null && (!is_string($voice) || trim($voice) === '')) {
            $errors['voice'][] = 'Doit être une chaîne non vide';
            $voice = null;
        }

        $speed = null;
        if (array_key_exists('speed', $body) && $body['speed'] !== null) {
            $speed = filter_var($body['speed'], FILTER_VALIDATE_FLOAT);
            if ($speed === false || $speed < 0.5 || $speed > 2.0) {
                $errors['speed'][] = 'Doit être compris entre 0.5 et 2.0';
                $speed = null;
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return ['voice' => $voice, 'speed' => $speed];
    }
}
