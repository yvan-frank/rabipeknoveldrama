<?php

declare(strict_types=1);

namespace App\Modules\Authors;

use App\Utils\ApiError;
use App\Utils\ValidationException;

/**
 * Équivalent de src/modules/authors/authors.schema.ts.
 */
final class AuthorsSchema
{
    private const DOCUMENT_TYPES = ['cni', 'passeport', 'autre'];

    public static function authorIdParam(string $raw): int
    {
        if (!ctype_digit($raw) || (int) $raw < 1) {
            throw ApiError::badRequest("Identifiant d'auteur invalide");
        }
        return (int) $raw;
    }

    /** @param array<string,mixed> $body */
    public static function kyc(array $body): array
    {
        $errors = [];

        $country = self::requireString($body, 'country', 1, 50, 'Le pays est requis', $errors);
        $address = self::requireString($body, 'address', 1, 50, "L'adresse est requise", $errors);

        $documentType = $body['documentType'] ?? null;
        if (!is_string($documentType) || !in_array($documentType, self::DOCUMENT_TYPES, true)) {
            $errors['documentType'][] = 'Type de document invalide';
        }

        $documentId = self::requireString($body, 'documentId', 1, 50, 'Le numéro du document est requis', $errors);
        $documents = self::requireString($body, 'documents', 1, null, 'Le document scanné est requis', $errors);
        $fullName = self::requireString($body, 'fullName', 1, 50, 'Le nom complet est requis', $errors);

        $socialLinks = self::socialLinks($body['socialLinks'] ?? null, $errors);

        if (($body['privacyAccepted'] ?? null) !== true) {
            $errors['privacyAccepted'][] = 'Vous devez accepter la politique de confidentialité';
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return [
            'country' => $country,
            'address' => $address,
            'documentType' => $documentType,
            'documentId' => $documentId,
            'documents' => $documents,
            'fullName' => $fullName,
            'socialLinks' => $socialLinks,
        ];
    }

    public static function kycVerification(array $body): bool
    {
        if (!is_bool($body['verified'] ?? null)) {
            throw new ValidationException(['verified' => ['Doit être un booléen']]);
        }
        return $body['verified'];
    }

    public static function kycBypass(array $body): bool
    {
        if (!is_bool($body['enabled'] ?? null)) {
            throw new ValidationException(['enabled' => ['Doit être un booléen']]);
        }
        return $body['enabled'];
    }

    /** @param array<string,mixed> $body */
    private static function requireString(array $body, string $field, int $min, ?int $max, string $emptyMessage, array &$errors): string
    {
        $value = $body[$field] ?? null;
        if (!is_string($value) || mb_strlen($value) < $min) {
            $errors[$field][] = $emptyMessage;
            return '';
        }
        if ($max !== null && mb_strlen($value) > $max) {
            $errors[$field][] = "Doit faire au plus {$max} caractère(s)";
            return '';
        }
        return $value;
    }

    /** @return array<string,string>|null */
    private static function socialLinks(mixed $raw, array &$errors): ?array
    {
        if ($raw === null) {
            return null;
        }
        if (!is_array($raw)) {
            $errors['socialLinks'][] = 'Format invalide';
            return null;
        }

        $links = [];
        foreach ($raw as $key => $value) {
            if (!is_string($value) || filter_var($value, FILTER_VALIDATE_URL) === false) {
                $errors['socialLinks'][] = "Lien invalide pour « {$key} »";
                continue;
            }
            $links[(string) $key] = $value;
        }

        return $links;
    }
}
