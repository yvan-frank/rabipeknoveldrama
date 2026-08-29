-- Permet à un administrateur de supprimer (soft-delete) un compte auteur,
-- symétrique à `users.deleted_at` déjà utilisé pour les lecteurs.
ALTER TABLE `author`
  ADD COLUMN `deleted_at` datetime(3) DEFAULT NULL AFTER `genres`;
