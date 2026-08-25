-- CreateTable
CREATE TABLE `daily_reading_time` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `total_seconds` INTEGER NOT NULL DEFAULT 0,
    `milestone_15_credited` BOOLEAN NOT NULL DEFAULT false,
    `milestone_30_credited` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `daily_reading_time_user_id_date_key`(`user_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `daily_reading_time` ADD CONSTRAINT `daily_reading_time_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;
