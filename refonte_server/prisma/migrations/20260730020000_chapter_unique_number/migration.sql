-- Empêche deux chapitres avec le même numéro pour un même livre
CREATE UNIQUE INDEX `chapters_id_book_chapter_number_key` ON `chapters`(`id_book`, `chapter_number`);
