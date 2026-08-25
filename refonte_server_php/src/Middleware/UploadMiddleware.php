<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Http\Request;
use App\Utils\ApiError;

/**
 * Équivalent de src/middlewares/upload.middleware.ts (Multer). PHP gère déjà
 * l'upload multipart nativement via $_FILES ; ce middleware se charge de la
 * validation (taille, type réel du fichier — détecté avec finfo plutôt que
 * de faire confiance au Content-Type envoyé par le client, qui est
 * falsifiable) et du déplacement vers un nom de fichier aléatoire, comme
 * côté Node.
 */
final class UploadMiddleware
{
    private const IMAGE_MIME_TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    // Pièce d'identité (KYC auteur) : mêmes formats image, plus PDF pour un scan.
    private const DOCUMENT_MIME_TYPES = self::IMAGE_MIME_TYPES + ['application/pdf' => 'pdf'];
    private const COVER_MAX_BYTES = 5 * 1024 * 1024;
    private const DOCUMENT_MAX_BYTES = 8 * 1024 * 1024;

    public static function coverImage(Request $request, callable $next): void
    {
        $request->file = self::handleUpload(
            'cover',
            'covers',
            self::IMAGE_MIME_TYPES,
            self::COVER_MAX_BYTES,
            'Image trop volumineuse (5 Mo maximum)',
            "Format d'image non supporté (jpg, png ou webp uniquement)",
        );
        $next($request);
    }

    public static function identityDocument(Request $request, callable $next): void
    {
        $request->file = self::handleUpload(
            'document',
            'documents',
            self::DOCUMENT_MIME_TYPES,
            self::DOCUMENT_MAX_BYTES,
            'Fichier trop volumineux (8 Mo maximum)',
            'Format non supporté (jpg, png, webp ou pdf uniquement)',
        );
        $next($request);
    }

    /**
     * @param array<string,string> $mimeTypes
     * @return array{filename:string}|null null si aucun fichier n'a été envoyé
     *   (le contrôleur traduit ça en 400 "Aucun fichier reçu", comme côté Node).
     */
    private static function handleUpload(
        string $fieldName,
        string $subdir,
        array $mimeTypes,
        int $maxBytes,
        string $tooLargeMessage,
        string $unsupportedTypeMessage,
    ): ?array {
        $file = $_FILES[$fieldName] ?? null;
        if ($file === null || $file['error'] === UPLOAD_ERR_NO_FILE) {
            return null;
        }

        if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
            throw ApiError::badRequest($tooLargeMessage);
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw ApiError::badRequest('Échec du téléversement du fichier');
        }
        if ($file['size'] > $maxBytes) {
            throw ApiError::badRequest($tooLargeMessage);
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $extension = $mimeTypes[$detectedType] ?? null;
        if ($extension === null) {
            throw ApiError::badRequest($unsupportedTypeMessage);
        }

        $root = dirname(__DIR__, 2);
        $targetDir = $root . '/public/uploads/' . $subdir;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $filename = self::uuidV4() . '.' . $extension;
        $targetPath = $targetDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            throw ApiError::internal('Impossible d\'enregistrer le fichier téléversé');
        }

        return ['filename' => $filename];
    }

    private static function uuidV4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
