-- Jetons de réinitialisation de mot de passe (POST /auth/forgot-password,
-- POST /auth/reset-password) — même forme que `refresh_tokens` (hash SHA-256
-- stocké, jamais le jeton en clair), `account_type`/`account_id` couvrant à
-- la fois `users` et `author` comme le fait déjà cette table.
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token_hash` varchar(64) NOT NULL,
  `account_type` varchar(10) NOT NULL,
  `account_id` int(11) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_reset_tokens_token_hash_key` (`token_hash`),
  KEY `password_reset_tokens_account_type_account_id_idx` (`account_type`,`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
