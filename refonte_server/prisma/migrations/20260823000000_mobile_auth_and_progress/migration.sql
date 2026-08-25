ALTER TABLE `readbook` ADD COLUMN `progress_percent` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `refresh_tokens` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `token_hash` VARCHAR(64) NOT NULL,
  `account_type` VARCHAR(10) NOT NULL,
  `account_id` INTEGER NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
  INDEX `refresh_tokens_account_type_account_id_idx`(`account_type`, `account_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
