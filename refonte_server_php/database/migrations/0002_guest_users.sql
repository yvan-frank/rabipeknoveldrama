-- Permet à un visiteur non authentifié d'obtenir des bonus/points et de
-- compléter les tâches (check-in, articles, temps de lecture...) via un
-- compte invité créé automatiquement, avant inscription éventuelle.
ALTER TABLE `users`
  MODIFY `email` varchar(150) DEFAULT NULL,
  MODIFY `password` varchar(255) DEFAULT NULL,
  ADD COLUMN `is_guest` tinyint(1) NOT NULL DEFAULT 0 AFTER `is_admin`;
