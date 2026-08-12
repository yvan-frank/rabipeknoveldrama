-- Réglage global administrable : désactivé par défaut pour conserver le KYC
-- obligatoire. La ligne id = 1 est créée à la première consultation par l'API.
CREATE TABLE `platform_settings` (
    `id` INTEGER NOT NULL,
    `author_kyc_bypass_enabled` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
