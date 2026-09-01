<?php

declare(strict_types=1);

namespace App\Modules\Authors;

use App\Lib\Database;
use App\Utils\ApiError;
use PDO;

/**
 * Équivalent de src/modules/authors/authors.service.ts.
 */
final class AuthorsService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    private const PUBLIC_AUTHOR_SELECT = 'id_author AS id, name, email, telephone, address, about, is_account_verified, created_at';

    public static function getAuthorById(int $id): array
    {
        $stmt = self::db()->prepare('SELECT ' . self::PUBLIC_AUTHOR_SELECT . ' FROM author WHERE id_author = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::notFound('Auteur introuvable');
        }
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'telephone' => $row['telephone'],
            'address' => $row['address'],
            'about' => $row['about'],
            'isAccountVerified' => (bool) $row['is_account_verified'],
            'createdAt' => $row['created_at'],
        ];
    }

    // Symétrique à UsersService::softDeleteUser — révoque l'accès sans perdre
    // l'historique (livres publiés, ventes...), contrairement à un DELETE dur.
    // L'email est aussi mangled (cf. commentaire équivalent côté users) pour
    // libérer author_email_key en vue d'une réinscription avec ce même email.
    public static function softDeleteAuthor(int $id): void
    {
        self::getAuthorById($id); // 404 si déjà supprimé/inexistant
        self::db()
            ->prepare("UPDATE author SET deleted_at = NOW(), email = CONCAT('deleted_', id_author, '_', UNIX_TIMESTAMP(), '_', LEFT(email, 90)) WHERE id_author = :id")
            ->execute(['id' => $id]);
    }

    // Coût identique à AuthService::SALT_COST (bcrypt).
    private const PASSWORD_SALT_COST = 12;

    // Édition admin : identité/contact de base + mot de passe. L'email est
    // contraint UNIQUE en base — un doublon remonte en 409 plutôt qu'en 500.
    /** @param array{name?:string,email?:string,telephone?:?string,address?:?string,about?:?string,isAccountVerified?:bool,password?:string} $input */
    public static function updateAuthor(int $id, array $input): array
    {
        self::getAuthorById($id);
        if ($input === []) {
            return self::getAuthorById($id);
        }

        $columns = [
            'name' => 'name', 'email' => 'email', 'telephone' => 'telephone',
            'address' => 'address', 'about' => 'about', 'isAccountVerified' => 'is_account_verified',
        ];
        $sets = [];
        $params = ['id' => $id];
        foreach ($columns as $key => $column) {
            if (array_key_exists($key, $input)) {
                $sets[] = "{$column} = :{$key}";
                $params[$key] = is_bool($input[$key]) ? ($input[$key] ? 1 : 0) : $input[$key];
            }
        }

        if (array_key_exists('password', $input)) {
            $sets[] = 'password = :password';
            $sets[] = 'password_changed_at = NOW()';
            $params['password'] = password_hash($input['password'], PASSWORD_BCRYPT, ['cost' => self::PASSWORD_SALT_COST]);
        }

        try {
            self::db()
                ->prepare('UPDATE author SET ' . implode(', ', $sets) . ', modified_at = NOW() WHERE id_author = :id')
                ->execute($params);
        } catch (\Throwable $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                throw ApiError::conflict('Cette adresse e-mail est déjà utilisée');
            }
            throw $e;
        }

        return self::getAuthorById($id);
    }

    // KYC "complet" = toutes les données d'identité renseignées ET la
    // politique de confidentialité acceptée — purement déclaratif (l'auteur a
    // rempli le formulaire), distinct de la vérification par un administrateur.
    public static function isKycComplete(?array $extension): bool
    {
        if ($extension === null) {
            return false;
        }
        return $extension['country'] !== null
            && $extension['address'] !== null
            && $extension['documentType'] !== null
            && $extension['documentId'] !== null
            && $extension['documents'] !== null
            && $extension['fullName'] !== null
            && $extension['privacyAcceptedAt'] !== null;
    }

    // La vérification (kycVerifiedAt) est ce qui autorise réellement les
    // actions d'écriture (cf. AuthorKycMiddleware) — un KYC complet mais pas
    // encore examiné par un administrateur ne suffit pas.
    public static function isKycVerified(?array $extension): bool
    {
        return $extension !== null && $extension['kycVerifiedAt'] !== null;
    }

    // Le bypass est un réglage global, volontairement désactivé par défaut.
    // Il ne falsifie pas les données KYC existantes : il autorise
    // temporairement les auteurs actuels et futurs à publier sans vérification.
    private static function getPlatformSettings(): array
    {
        $db = self::db();
        $db->prepare('INSERT INTO platform_settings (id, author_kyc_bypass_enabled, updated_at) VALUES (1, 0, NOW()) ON DUPLICATE KEY UPDATE id = id')
            ->execute();

        $stmt = $db->prepare('SELECT author_kyc_bypass_enabled FROM platform_settings WHERE id = 1');
        $stmt->execute();
        return $stmt->fetch();
    }

    public static function getAuthorKycBypassPolicy(): array
    {
        $settings = self::getPlatformSettings();
        return ['enabled' => (bool) $settings['author_kyc_bypass_enabled']];
    }

    public static function setAuthorKycBypassPolicy(bool $enabled): array
    {
        $db = self::db();
        $db->prepare(
            'INSERT INTO platform_settings (id, author_kyc_bypass_enabled, updated_at) VALUES (1, :enabled, NOW())
             ON DUPLICATE KEY UPDATE author_kyc_bypass_enabled = VALUES(author_kyc_bypass_enabled), updated_at = NOW()',
        )->execute(['enabled' => $enabled ? 1 : 0]);

        return ['enabled' => $enabled];
    }

    public static function getMyKyc(int $authorId): array
    {
        $extension = self::fetchExtension($authorId);
        return [
            'extension' => $extension,
            'isComplete' => self::isKycComplete($extension),
            'isVerified' => self::isKycVerified($extension),
        ];
    }

    /** @param array{country:string,address:string,documentType:string,documentId:string,documents:string,fullName:string,socialLinks:?array} $input */
    public static function submitKyc(int $authorId, array $input): array
    {
        $db = self::db();
        $socialLinksJson = $input['socialLinks'] !== null ? json_encode($input['socialLinks'], JSON_UNESCAPED_UNICODE) : null;

        $db->prepare(
            'INSERT INTO author_extension (author_id, country, address, document_type, document_id, documents, full_name, social_links, privacy_accepted_at, kyc_verified_at, created_at)
             VALUES (:authorId, :country, :address, :documentType, :documentId, :documents, :fullName, :socialLinks, NOW(), NULL, NOW())
             ON DUPLICATE KEY UPDATE
                country = VALUES(country), address = VALUES(address), document_type = VALUES(document_type),
                document_id = VALUES(document_id), documents = VALUES(documents), full_name = VALUES(full_name),
                social_links = VALUES(social_links), privacy_accepted_at = VALUES(privacy_accepted_at),
                kyc_verified_at = NULL, modified_at = NOW()',
        )->execute([
            'authorId' => $authorId,
            'country' => $input['country'],
            'address' => $input['address'],
            'documentType' => $input['documentType'],
            'documentId' => $input['documentId'],
            'documents' => $input['documents'],
            'fullName' => $input['fullName'],
            'socialLinks' => $socialLinksJson,
        ]);

        return self::fetchExtension($authorId);
    }

    // Espace admin : liste de tous les auteurs ayant soumis un KYC (au moins
    // partiellement), avec leur statut, pour la page de vérification.
    public static function listAuthorsForKycReview(): array
    {
        $stmt = self::db()->prepare(
            'SELECT a.id_author, a.name, a.email,
                    ae.id_author_ext, ae.country, ae.address, ae.document_type, ae.document_id, ae.documents,
                    ae.full_name, ae.social_links, ae.privacy_accepted_at, ae.kyc_verified_at, ae.created_at, ae.modified_at
             FROM author a
             JOIN author_extension ae ON ae.author_id = a.id_author
             WHERE a.deleted_at IS NULL
             ORDER BY ae.modified_at DESC',
        );
        $stmt->execute();

        return array_map(static function (array $row): array {
            $extension = self::mapExtension($row);
            return [
                'id' => (int) $row['id_author'],
                'name' => $row['name'],
                'email' => $row['email'],
                'extension' => $extension,
                'isComplete' => self::isKycComplete($extension),
                'isVerified' => self::isKycVerified($extension),
            ];
        }, $stmt->fetchAll());
    }

    public static function setAuthorKycVerification(int $authorId, bool $verified): array
    {
        $extension = self::fetchExtension($authorId);
        if ($extension === null) {
            throw ApiError::notFound("Cet auteur n'a pas encore soumis de KYC");
        }
        if ($verified && !self::isKycComplete($extension)) {
            throw ApiError::badRequest('Le KYC de cet auteur est incomplet, impossible de le vérifier');
        }

        self::db()->prepare('UPDATE author_extension SET kyc_verified_at = :verifiedAt, modified_at = NOW() WHERE author_id = :authorId')
            ->execute(['verifiedAt' => $verified ? date('Y-m-d H:i:s') : null, 'authorId' => $authorId]);

        return self::fetchExtension($authorId);
    }

    // Utilisé par AuthorKycMiddleware pour bloquer les actions d'écriture
    // (livres/chapitres) tant que le KYC n'est pas vérifié.
    public static function assertAuthorKycComplete(int $authorId): void
    {
        if (self::getAuthorKycBypassPolicy()['enabled']) {
            return;
        }

        $extension = self::fetchExtension($authorId);
        if (!self::isKycComplete($extension)) {
            throw ApiError::forbidden('Complétez la vérification de votre identité (KYC) avant de continuer.');
        }
        if (!self::isKycVerified($extension)) {
            throw ApiError::forbidden('Votre KYC est en attente de vérification par un administrateur.');
        }
    }

    private static function fetchExtension(int $authorId): ?array
    {
        $stmt = self::db()->prepare(
            'SELECT id_author_ext, country, address, document_type, document_id, documents, full_name,
                    social_links, privacy_accepted_at, kyc_verified_at, created_at, modified_at
             FROM author_extension WHERE author_id = :authorId',
        );
        $stmt->execute(['authorId' => $authorId]);
        $row = $stmt->fetch();
        return $row === false ? null : self::mapExtension($row);
    }

    private static function mapExtension(array $row): array
    {
        $socialLinks = $row['social_links'] !== null ? json_decode((string) $row['social_links'], true) : null;

        return [
            'id' => (int) $row['id_author_ext'],
            'country' => $row['country'],
            'address' => $row['address'],
            'documentType' => $row['document_type'],
            'documentId' => $row['document_id'],
            'documents' => $row['documents'],
            'fullName' => $row['full_name'],
            'socialLinks' => $socialLinks,
            'privacyAcceptedAt' => $row['privacy_accepted_at'],
            'kycVerifiedAt' => $row['kyc_verified_at'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['modified_at'],
        ];
    }
}
