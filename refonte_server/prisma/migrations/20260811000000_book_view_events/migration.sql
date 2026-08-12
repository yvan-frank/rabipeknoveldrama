CREATE TABLE `book_view_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `visitor_hash` CHAR(64) NOT NULL,
    `country` VARCHAR(2) NULL,
    `platform` VARCHAR(20) NULL,
    `viewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `book_view_events_book_id_viewed_at_idx`(`book_id`, `viewed_at`),
    INDEX `book_view_events_book_id_visitor_hash_viewed_at_idx`(`book_id`, `visitor_hash`, `viewed_at`),
    INDEX `book_view_events_user_id_viewed_at_idx`(`user_id`, `viewed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `book_view_events` ADD CONSTRAINT `book_view_events_book_id_fkey`
  FOREIGN KEY (`book_id`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;
