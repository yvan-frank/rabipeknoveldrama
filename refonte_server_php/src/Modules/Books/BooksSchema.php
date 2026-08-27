<?php

declare(strict_types=1);

namespace App\Modules\Books;

use App\Utils\ApiError;
use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/books/books.schema.ts. La coercition de types
 * (query strings -> int/bool, valeurs par défaut) est trop spécifique par
 * champ pour le Validator générique (App\Utils\Validator) : comme Zod côté
 * Node, chaque méthode ici fait à la fois coercition, valeurs par défaut et
 * validation, et renvoie un tableau "propre" ou lève une ValidationException
 * au même format ({champ: [messages]}) que le reste de l'API.
 */
final class BooksSchema
{
    /** @param array<string,mixed> $query */
    public static function listQuery(array $query): array
    {
        return [
            'page' => self::intOrDefault($query['page'] ?? null, 1, 1),
            'pageSize' => self::intOrDefault($query['pageSize'] ?? null, 20, 1, 100),
            'categoryId' => self::optionalPositiveInt($query['categoryId'] ?? null),
            'authorId' => self::optionalPositiveInt($query['authorId'] ?? null),
            'search' => self::optionalString($query['search'] ?? null, 255),
            'isFree' => self::optionalBool($query['isFree'] ?? null),
        ];
    }

    /** @param array<string,mixed> $query */
    public static function topRatedQuery(array $query): array
    {
        return ['limit' => self::intOrDefault($query['limit'] ?? null, 6, 1, 20)];
    }

    public static function idParam(string $raw): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest('Identifiant invalide');
        }
        return (int) $raw;
    }

    public static function slugParam(string $raw): string
    {
        if (trim($raw) === '') {
            throw ApiError::badRequest('Slug invalide');
        }
        return $raw;
    }

    /** @param array<string,mixed> $body */
    public static function create(array $body): array
    {
        $errors = [];

        $title = self::requireString($body, 'title', 1, 255, $errors);
        $datePub = self::requireDate($body, 'datePub', $errors);
        $cover = self::requireString($body, 'cover', 1, null, $errors);
        $filePath = self::optionalString($body['filePath'] ?? null, 255);
        $price = self::requireInt($body, 'price', 0, null, $errors);
        // Facultatifs (contrairement aux autres champs ci-dessus) : le nombre
        // de pages n'est qu'indicatif et le résumé peut être complété plus
        // tard depuis la fiche du livre — les forcer bloquait inutilement la
        // création rapide d'un livre, notamment côté mobile.
        $pageNumber = self::intOrDefault($body['pageNumber'] ?? null, 0, 0);
        $bookLink = self::optionalString($body['bookLink'] ?? null, null);
        $resume = self::optionalString($body['resume'] ?? null, null) ?? '';
        $categoryId = self::requireInt($body, 'categoryId', 1, null, $errors);
        $authorId = self::requireInt($body, 'authorId', 1, null, $errors);

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return [
            'title' => $title,
            'datePub' => $datePub,
            'cover' => $cover,
            'filePath' => $filePath,
            'price' => $price,
            'pageNumber' => $pageNumber,
            'bookLink' => $bookLink,
            'resume' => $resume,
            'isFree' => self::boolOrDefault($body['isFree'] ?? null, true),
            'readBeforePay' => self::boolOrDefault($body['readBeforePay'] ?? null, false),
            'freeChapterCount' => self::intOrDefault($body['freeChapterCount'] ?? null, 3, 0),
            'isPromotion' => self::boolOrDefault($body['isPromotion'] ?? null, false),
            'promotionPrice' => self::intOrDefault($body['promotionPrice'] ?? null, 0, 0),
            'isAdultOnly' => self::boolOrDefault($body['isAdultOnly'] ?? null, false),
            'categoryId' => $categoryId,
            'authorId' => $authorId,
            'extension' => self::extension($body['extension'] ?? null),
        ];
    }

    // Mêmes champs que create(), tous optionnels, authorId exclu (on ne
    // change jamais le propriétaire d'un livre via update).
    /** @param array<string,mixed> $body */
    public static function update(array $body): array
    {
        $errors = [];
        $out = [];

        if (array_key_exists('title', $body)) {
            $out['title'] = self::requireString($body, 'title', 1, 255, $errors);
        }
        if (array_key_exists('datePub', $body)) {
            $out['datePub'] = self::requireDate($body, 'datePub', $errors);
        }
        if (array_key_exists('cover', $body)) {
            $out['cover'] = self::requireString($body, 'cover', 1, null, $errors);
        }
        if (array_key_exists('filePath', $body)) {
            $out['filePath'] = self::optionalString($body['filePath'], 255);
        }
        if (array_key_exists('price', $body)) {
            $out['price'] = self::requireInt($body, 'price', 0, null, $errors);
        }
        if (array_key_exists('pageNumber', $body)) {
            $out['pageNumber'] = self::requireInt($body, 'pageNumber', 1, null, $errors);
        }
        if (array_key_exists('bookLink', $body)) {
            $out['bookLink'] = self::optionalString($body['bookLink'], null);
        }
        if (array_key_exists('resume', $body)) {
            $out['resume'] = self::requireString($body, 'resume', 1, null, $errors);
        }
        if (array_key_exists('isFree', $body)) {
            $out['isFree'] = self::boolOrDefault($body['isFree'], true);
        }
        if (array_key_exists('readBeforePay', $body)) {
            $out['readBeforePay'] = self::boolOrDefault($body['readBeforePay'], false);
        }
        if (array_key_exists('freeChapterCount', $body)) {
            $out['freeChapterCount'] = self::intOrDefault($body['freeChapterCount'], 3, 0);
        }
        if (array_key_exists('isPromotion', $body)) {
            $out['isPromotion'] = self::boolOrDefault($body['isPromotion'], false);
        }
        if (array_key_exists('promotionPrice', $body)) {
            $out['promotionPrice'] = self::intOrDefault($body['promotionPrice'], 0, 0);
        }
        if (array_key_exists('isAdultOnly', $body)) {
            $out['isAdultOnly'] = self::boolOrDefault($body['isAdultOnly'], false);
        }
        if (array_key_exists('categoryId', $body)) {
            $out['categoryId'] = self::requireInt($body, 'categoryId', 1, null, $errors);
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
    public static function moderate(array $body): string
    {
        $allowed = ['publish', 'unpublish', 'block', 'suspend', 'delete'];
        $action = $body['action'] ?? null;
        $confirmation = $body['confirmationPhrase'] ?? null;
        $errors = [];

        if (!is_string($action) || !in_array($action, $allowed, true)) {
            $errors['action'][] = 'Action invalide';
        }
        if ($confirmation !== 'CONFIRMER') {
            $errors['confirmationPhrase'][] = 'Confirmation requise';
        }
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return $action;
    }

    /** @param array<string,mixed> $body */
    public static function assertDeleteConfirmation(array $body): void
    {
        if (($body['confirmationPhrase'] ?? null) !== 'SUPPRIMER') {
            throw new ValidationException(['confirmationPhrase' => ['Saisissez exactement « SUPPRIMER » pour confirmer la suppression']]);
        }
    }

    /** @param array<string,mixed> $body */
    public static function grantEmail(array $body): array
    {
        $email = is_string($body['email'] ?? null) ? trim($body['email']) : '';
        $note = self::optionalString($body['note'] ?? null, 500);
        $errors = [];

        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errors['email'][] = 'Email invalide';
        }
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return ['email' => $email, 'note' => $note];
    }

    // -- Helpers de coercition/validation, dans l'esprit de z.coerce/.default() --

    private static function intOrDefault(mixed $value, int $default, ?int $min = null, ?int $max = null): int
    {
        if ($value === null || $value === '') {
            return $default;
        }
        $int = filter_var($value, FILTER_VALIDATE_INT);
        if ($int === false) {
            return $default;
        }
        if ($min !== null && $int < $min) {
            return $default;
        }
        if ($max !== null && $int > $max) {
            return $max;
        }
        return $int;
    }

    private static function optionalPositiveInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        $int = filter_var($value, FILTER_VALIDATE_INT);
        return $int !== false && $int > 0 ? $int : null;
    }

    private static function optionalString(mixed $value, ?int $max): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }
        if ($max !== null && mb_strlen($value) > $max) {
            return mb_substr($value, 0, $max);
        }
        return $value;
    }

    private static function optionalBool(mixed $value): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }
        $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        return $bool;
    }

    private static function boolOrDefault(mixed $value, bool $default): bool
    {
        if ($value === null) {
            return $default;
        }
        $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        return $bool ?? $default;
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

    /** @param array<string,mixed> $body */
    private static function requireInt(array $body, string $field, ?int $min, ?int $max, array &$errors): int
    {
        $value = $body[$field] ?? null;
        $int = filter_var($value, FILTER_VALIDATE_INT);
        if ($int === false) {
            $errors[$field][] = 'Doit être un entier';
            return 0;
        }
        if ($min !== null && $int < $min) {
            $errors[$field][] = "Doit être supérieur ou égal à {$min}";
            return 0;
        }
        if ($max !== null && $int > $max) {
            $errors[$field][] = "Doit être inférieur ou égal à {$max}";
            return 0;
        }
        return $int;
    }

    /** @param array<string,mixed> $body */
    private static function requireDate(array $body, string $field, array &$errors): string
    {
        $value = $body[$field] ?? null;
        $timestamp = is_string($value) ? strtotime($value) : false;
        if ($timestamp === false) {
            $errors[$field][] = 'Date invalide';
            return '';
        }
        return date('Y-m-d H:i:s', $timestamp);
    }

    /** @return array{introduction:?string,topics:?string,conclusion:?string,language:?string}|null */
    private static function extension(mixed $raw): ?array
    {
        if (!is_array($raw)) {
            return null;
        }
        return [
            'introduction' => self::optionalString($raw['introduction'] ?? null, null),
            'topics' => self::optionalString($raw['topics'] ?? null, null),
            'conclusion' => self::optionalString($raw['conclusion'] ?? null, null),
            'language' => self::optionalString($raw['language'] ?? null, 50),
        ];
    }
}
