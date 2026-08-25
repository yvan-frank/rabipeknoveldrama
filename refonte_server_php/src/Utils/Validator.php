<?php

declare(strict_types=1);

namespace App\Utils;

/**
 * Validateur générique à base de règles, équivalent scaffold des schémas Zod
 * (*.schema.ts). Chaque module PHP définit ses règles sous la même forme que
 * son pendant Node ('email' => ['required','email'], ...). Retourne les
 * données nettoyées (comme schema.parse() côté Zod) ou lève une
 * ValidationException avec des erreurs par champ, au même format que
 * ZodError.flatten().fieldErrors.
 */
final class Validator
{
    /**
     * @param array<string,mixed> $data
     * @param array<string,list<string>> $rules
     * @return array<string,mixed>
     */
    public static function validate(array $data, array $rules): array
    {
        $errors = [];
        $clean = [];

        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;
            $isOptional = in_array('optional', $fieldRules, true);

            if ($value === null || $value === '') {
                if ($isOptional) {
                    continue;
                }
                if (in_array('required', $fieldRules, true)) {
                    $errors[$field][] = 'Champ requis';
                    continue;
                }
            }

            $fieldErrors = [];
            foreach ($fieldRules as $rule) {
                [$name, $param] = str_contains($rule, ':') ? explode(':', $rule, 2) : [$rule, null];
                $error = self::applyRule($name, $param, $value);
                if ($error !== null) {
                    $fieldErrors[] = $error;
                }
            }

            if ($fieldErrors !== []) {
                $errors[$field] = $fieldErrors;
                continue;
            }

            $clean[$field] = $value;
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return $clean;
    }

    private static function applyRule(string $name, ?string $param, mixed $value): ?string
    {
        return match ($name) {
            'required', 'optional' => null,
            'string' => is_string($value) ? null : 'Doit être une chaîne de caractères',
            'email' => is_string($value) && filter_var($value, FILTER_VALIDATE_EMAIL) !== false ? null : 'Email invalide',
            'int' => (is_int($value) || (is_string($value) && ctype_digit($value))) ? null : 'Doit être un entier',
            'number' => is_numeric($value) ? null : 'Doit être un nombre',
            'array' => is_array($value) ? null : 'Doit être une liste',
            'positive' => (is_numeric($value) && (float) $value > 0) ? null : 'Doit être positif',
            'min' => self::checkMin($value, (int) $param),
            'max' => self::checkMax($value, (int) $param),
            default => null,
        };
    }

    private static function checkMin(mixed $value, int $min): ?string
    {
        $length = is_array($value) ? count($value) : mb_strlen((string) $value);
        return $length >= $min ? null : "Doit faire au moins {$min} caractère(s)";
    }

    private static function checkMax(mixed $value, int $max): ?string
    {
        $length = is_array($value) ? count($value) : mb_strlen((string) $value);
        return $length <= $max ? null : "Doit faire au plus {$max} caractère(s)";
    }
}
