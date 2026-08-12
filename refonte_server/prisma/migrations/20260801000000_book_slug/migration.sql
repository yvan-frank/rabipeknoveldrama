-- URL publique SEO d'un livre (ex. "mira-partie-i"), distincte de l'ancien
-- champ `book_link` legacy jamais exploité pour le routage.
ALTER TABLE `books` ADD COLUMN `slug` VARCHAR(255) NULL;

-- Backfill des lignes existantes effectué séparément (prisma/backfill-slugs.ts)
-- avant que la contrainte NOT NULL ci-dessous ne soit appliquée.
ALTER TABLE `books` MODIFY COLUMN `slug` VARCHAR(255) NOT NULL;

CREATE UNIQUE INDEX `books_slug_key` ON `books`(`slug`);
