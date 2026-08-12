-- Nombre de chapitres lisibles gratuitement (à partir du n°1) avant que
-- l'achat du livre ne soit requis.
ALTER TABLE `books` ADD COLUMN `free_chapter_count` INT NOT NULL DEFAULT 3;
