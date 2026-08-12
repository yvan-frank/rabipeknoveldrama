CREATE TABLE `book_review_replies` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `comment_id` INTEGER NOT NULL,
  `responder_id` INTEGER NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `book_review_replies_comment_id_key`(`comment_id`),
  INDEX `book_review_replies_responder_id_idx`(`responder_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `book_review_replies` ADD CONSTRAINT `book_review_replies_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `commentaires`(`id_comment`) ON DELETE CASCADE ON UPDATE CASCADE;
