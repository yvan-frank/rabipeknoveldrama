<?php

declare(strict_types=1);

namespace App\Modules\Auth;

use App\Config\Env;
use App\Lib\Database;
use App\Utils\ApiError;
use App\Utils\Jwt;
use App\Utils\UserCode;
use PDO;

/**
 * Équivalent de src/modules/auth/auth.service.ts. L'inscription auteur
 * (`registerAuthor`, KYC, genres) reste non portée — cf. AuthRoutes.php —
 * mais la connexion couvre désormais aussi bien `users` que `author`
 * (module Authors écrit depuis), comme côté Node login().
 */
final class AuthService
{
    private const SALT_COST = 12; // équivalent de SALT_ROUNDS côté bcrypt Node
    private const REFRESH_TOKEN_BYTES = 48;

    private static function db(): PDO
    {
        return Database::connection();
    }

    /**
     * Crée un compte invité (sans email/mot de passe) permettant d'obtenir
     * des bonus et de compléter des tâches sans inscription préalable.
     */
    public static function createGuest(): array
    {
        $db = self::db();

        $stmt = $db->prepare('INSERT INTO users (name, email, password, is_admin, is_guest, is_active, points_balance, created_at, updated_at)
            VALUES (NULL, NULL, NULL, 0, 1, 1, 0, NOW(), NOW())');
        $stmt->execute();

        $id = (int) $db->lastInsertId();

        return [
            'id' => $id,
            'userCode' => UserCode::format($id),
            'email' => null,
            'role' => 'guest',
        ];
    }

    /**
     * @param array{name:string,email:string,password:string} $input
     * @param int|null $guestUserId compte invité courant (cookie), converti
     *   en compte réel plutôt que recréé, pour conserver ses points acquis.
     */
    public static function register(array $input, ?int $guestUserId = null): array
    {
        $db = self::db();

        $existing = self::findUserByEmail($db, $input['email']);
        if ($existing !== false) {
            throw ApiError::conflict('Un compte existe déjà avec cet email');
        }

        $passwordHash = password_hash($input['password'], PASSWORD_BCRYPT, ['cost' => self::SALT_COST]);

        $guestRow = $guestUserId !== null ? self::findGuestById($db, $guestUserId) : false;

        if ($guestRow !== false) {
            $stmt = $db->prepare('UPDATE users SET name = :name, email = :email, password = :password, is_guest = 0, is_active = 1, updated_at = NOW()
                WHERE id_user = :id');
            $stmt->execute([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $passwordHash,
                'id' => $guestUserId,
            ]);

            $userId = $guestUserId;
        } else {
            $stmt = $db->prepare('INSERT INTO users (name, email, password, is_admin, is_active, points_balance, created_at, updated_at)
                VALUES (:name, :email, :password, 0, 1, 0, NOW(), NOW())');
            $stmt->execute([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $passwordHash,
            ]);

            $userId = (int) $db->lastInsertId();
        }

        $authUser = [
            'id' => $userId,
            'email' => $input['email'],
            'role' => 'user',
        ];

        return self::issueSession($authUser);
    }

    private static function findGuestById(PDO $db, int $userId): array|false
    {
        $stmt = $db->prepare('SELECT id_user FROM users WHERE id_user = :id AND is_guest = 1 AND deleted_at IS NULL LIMIT 1');
        $stmt->execute(['id' => $userId]);
        return $stmt->fetch();
    }

    /** @param array{email:string,password:string} $input */
    public static function login(array $input): array
    {
        $db = self::db();
        $row = self::findUserByEmail($db, $input['email']);

        if ($row !== false) {
            if (!password_verify($input['password'], $row['password'])) {
                throw ApiError::unauthorized('Email ou mot de passe incorrect');
            }

            return self::issueSession([
                'id' => (int) $row['id_user'],
                'email' => $row['email'],
                'role' => ((bool) $row['is_admin']) ? 'admin' : 'user',
            ]);
        }

        $author = self::findAuthorByEmail($db, $input['email']);
        if ($author === false || !password_verify($input['password'], $author['password'])) {
            throw ApiError::unauthorized('Email ou mot de passe incorrect');
        }

        return self::issueSession([
            'id' => (int) $author['id_author'],
            'email' => $author['email'],
            'role' => 'author',
            'authorId' => (int) $author['id_author'],
        ]);
    }

    public static function logout(?string $refreshToken): void
    {
        if ($refreshToken === null || $refreshToken === '') {
            return;
        }
        self::revokeRefreshToken($refreshToken);
    }

    /** @return array{user:array,accessToken:string,refreshToken:string} */
    public static function refreshAccessToken(string $refreshToken): array
    {
        $db = self::db();
        $hash = hash('sha256', $refreshToken);

        $stmt = $db->prepare('SELECT * FROM refresh_tokens WHERE token_hash = :hash LIMIT 1');
        $stmt->execute(['hash' => $hash]);
        $record = $stmt->fetch();

        if (
            $record === false
            || $record['revoked_at'] !== null
            || strtotime((string) $record['expires_at']) < time()
        ) {
            throw ApiError::unauthorized('Refresh token invalide ou expiré');
        }

        $authUser = self::loadAuthUser($db, (string) $record['account_type'], (int) $record['account_id']);

        // Rotation : le refresh token consommé est révoqué, un nouveau est émis.
        $revoke = $db->prepare('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = :id');
        $revoke->execute(['id' => $record['id']]);

        $accessToken = Jwt::sign($authUser, Env::jwtSecret(), Env::durationSeconds('JWT_ACCESS_EXPIRES_IN', '15m'));
        $newRefreshToken = self::issueRefreshToken($db, $authUser);

        return ['user' => $authUser, 'accessToken' => $accessToken, 'refreshToken' => $newRefreshToken];
    }

    public static function me(array $user): array
    {
        return $user;
    }

    private static function revokeRefreshToken(string $refreshToken): void
    {
        $hash = hash('sha256', $refreshToken);
        $stmt = self::db()->prepare('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = :hash AND revoked_at IS NULL');
        $stmt->execute(['hash' => $hash]);
    }

    private static function findUserByEmail(PDO $db, string $email): array|false
    {
        $stmt = $db->prepare('SELECT * FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1');
        $stmt->execute(['email' => $email]);
        return $stmt->fetch();
    }

    private static function findAuthorByEmail(PDO $db, string $email): array|false
    {
        $stmt = $db->prepare('SELECT id_author, email, password FROM author WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        return $stmt->fetch();
    }

    private static function loadAuthUser(PDO $db, string $accountType, int $accountId): array
    {
        if ($accountType === 'author') {
            $stmt = $db->prepare('SELECT id_author, email FROM author WHERE id_author = :id LIMIT 1');
            $stmt->execute(['id' => $accountId]);
            $row = $stmt->fetch();
            if ($row === false) {
                throw ApiError::unauthorized('Compte introuvable');
            }

            return [
                'id' => (int) $row['id_author'],
                'userCode' => UserCode::format((int) $row['id_author']),
                'email' => $row['email'],
                'role' => 'author',
                'authorId' => (int) $row['id_author'],
            ];
        }

        $stmt = $db->prepare('SELECT id_user, email, is_admin FROM users WHERE id_user = :id AND deleted_at IS NULL LIMIT 1');
        $stmt->execute(['id' => $accountId]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw ApiError::unauthorized('Compte introuvable');
        }

        return [
            'id' => (int) $row['id_user'],
            'userCode' => UserCode::format((int) $row['id_user']),
            'email' => $row['email'],
            'role' => ((bool) $row['is_admin']) ? 'admin' : 'user',
        ];
    }

    /** @param array{id:int,email:string,role:string} $authUser */
    private static function issueSession(array $authUser): array
    {
        $authUser['userCode'] = UserCode::format($authUser['id']);
        $db = self::db();
        $token = Jwt::sign($authUser, Env::jwtSecret(), Env::durationSeconds('JWT_EXPIRES_IN', '7d'));
        $accessToken = Jwt::sign($authUser, Env::jwtSecret(), Env::durationSeconds('JWT_ACCESS_EXPIRES_IN', '15m'));
        $refreshToken = self::issueRefreshToken($db, $authUser);

        return ['user' => $authUser, 'token' => $token, 'accessToken' => $accessToken, 'refreshToken' => $refreshToken];
    }

    private static function issueRefreshToken(PDO $db, array $authUser): string
    {
        $token = bin2hex(random_bytes(self::REFRESH_TOKEN_BYTES));
        $hash = hash('sha256', $token);
        $ttlDays = Env::int('JWT_REFRESH_TOKEN_TTL_DAYS', 30);

        $stmt = $db->prepare('INSERT INTO refresh_tokens (token_hash, account_type, account_id, expires_at, created_at)
            VALUES (:hash, :accountType, :accountId, DATE_ADD(NOW(), INTERVAL :ttlDays DAY), NOW())');
        $stmt->execute([
            'hash' => $hash,
            'accountType' => $authUser['role'] === 'author' ? 'author' : 'user',
            'accountId' => $authUser['id'],
            'ttlDays' => $ttlDays,
        ]);

        return $token;
    }
}
