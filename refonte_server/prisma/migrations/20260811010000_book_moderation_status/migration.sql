ALTER TABLE `books` ADD COLUMN `is_published` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `books` ADD COLUMN `is_blocked` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `books` ADD COLUMN `suspended_at` DATETIME(3) NULL;
CREATE INDEX `books_is_published_is_blocked_suspended_at_idx` ON `books`(`is_published`, `is_blocked`, `suspended_at`);
