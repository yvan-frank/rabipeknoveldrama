-- Un seul enregistrement de progression par (utilisateur, livre) : chaque
-- lecture d'un chapitre écrase la position précédente au lieu d'empiler un
-- historique, pour servir de source unique au "reprendre la lecture".
CREATE UNIQUE INDEX `readbook_id_user_id_book_key` ON `readbook`(`id_user`, `id_book`);
