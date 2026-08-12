-- Fil de discussion sur les commentaires de chapitre : une réponse pointe
-- vers son commentaire parent.
ALTER TABLE `comments_chapter` ADD COLUMN `parent_id` INT NULL;

CREATE INDEX `comments_chapter_parent_id_idx` ON `comments_chapter`(`parent_id`);

ALTER TABLE `comments_chapter`
  ADD CONSTRAINT `comments_chapter_parent_id_fkey`
  FOREIGN KEY (`parent_id`) REFERENCES `comments_chapter`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
