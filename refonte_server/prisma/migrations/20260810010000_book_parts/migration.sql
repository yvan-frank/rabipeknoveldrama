-- Parties achetables d'un livre. Les colonnes book_id existantes des paniers
-- et achats restent obligatoires pour préserver les titres et achats legacy.
CREATE TABLE `book_parts` (
    `id_book_part` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `part_number` INTEGER NOT NULL,
    `description` TEXT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `is_free` BOOLEAN NOT NULL DEFAULT false,
    `free_chapter_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `book_parts_book_id_part_number_key`(`book_id`, `part_number`),
    INDEX `book_parts_book_id_idx`(`book_id`),
    PRIMARY KEY (`id_book_part`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `chapters` ADD COLUMN `part_id` INTEGER NULL;
CREATE INDEX `chapters_part_id_idx` ON `chapters`(`part_id`);

ALTER TABLE `cart` ADD COLUMN `part_id` INTEGER NULL;
CREATE INDEX `cart_part_id_idx` ON `cart`(`part_id`);

ALTER TABLE `achat` ADD COLUMN `part_id` INTEGER NULL;
CREATE INDEX `achat_part_id_idx` ON `achat`(`part_id`);

ALTER TABLE `book_parts`
  ADD CONSTRAINT `book_parts_book_id_fkey`
  FOREIGN KEY (`book_id`) REFERENCES `books`(`id_book`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `chapters`
  ADD CONSTRAINT `chapters_part_id_fkey`
  FOREIGN KEY (`part_id`) REFERENCES `book_parts`(`id_book_part`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `cart`
  ADD CONSTRAINT `cart_part_id_fkey`
  FOREIGN KEY (`part_id`) REFERENCES `book_parts`(`id_book_part`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `achat`
  ADD CONSTRAINT `achat_part_id_fkey`
  FOREIGN KEY (`part_id`) REFERENCES `book_parts`(`id_book_part`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
