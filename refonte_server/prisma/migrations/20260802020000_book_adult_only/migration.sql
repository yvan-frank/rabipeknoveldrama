-- Public visé du livre : réservé aux 18 ans et plus ou non — pilote la
-- demande de confirmation d'âge sur la page détail publique.
ALTER TABLE `books`
  ADD COLUMN `is_adult_only` BOOLEAN NOT NULL DEFAULT false;
