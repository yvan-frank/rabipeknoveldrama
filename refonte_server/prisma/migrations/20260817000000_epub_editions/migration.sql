CREATE TABLE `epub_editions` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `book_id` INTEGER NOT NULL,
  `version` INTEGER NOT NULL,
  `status` ENUM('QUEUED', 'PROCESSING', 'READY', 'FAILED') NOT NULL DEFAULT 'QUEUED',
  `storage_key` VARCHAR(500) NULL,
  `file_size_bytes` INTEGER NULL,
  `checksum` VARCHAR(64) NULL,
  `source_revision` VARCHAR(64) NOT NULL,
  `error_message` TEXT NULL,
  `generated_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `epub_editions_book_id_version_key`(`book_id`, `version`),
  INDEX `epub_editions_book_id_status_idx`(`book_id`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `epub_assets` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `epub_edition_id` INTEGER NOT NULL,
  `source_url` TEXT NULL,
  `archive_path` VARCHAR(500) NOT NULL,
  `storage_key` VARCHAR(500) NULL,
  `media_type` VARCHAR(100) NOT NULL,
  `checksum` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `epub_assets_epub_edition_id_archive_path_key`(`epub_edition_id`, `archive_path`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `epub_editions` ADD CONSTRAINT `epub_editions_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `epub_assets` ADD CONSTRAINT `epub_assets_epub_edition_id_fkey` FOREIGN KEY (`epub_edition_id`) REFERENCES `epub_editions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
