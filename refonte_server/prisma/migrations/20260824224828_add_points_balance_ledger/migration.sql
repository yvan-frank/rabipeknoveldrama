-- DropIndex
DROP INDEX `books_is_published_is_blocked_suspended_at_idx` ON `books`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `points_balance` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `points_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `points_transactions_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `points_transactions` ADD CONSTRAINT `points_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE UNIQUE INDEX `cart_id_user_part_id_key` ON `cart`(`id_user`, `part_id`);
DROP INDEX `cart_user_id_part_id_key` ON `cart`;
