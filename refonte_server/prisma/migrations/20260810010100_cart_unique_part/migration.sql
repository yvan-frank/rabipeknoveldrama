-- Une partie ne peut apparaître qu'une fois dans le panier d'un utilisateur.
-- MySQL autorise plusieurs valeurs NULL : les lignes legacy de livre entier
-- restent donc compatibles avec cette contrainte.
CREATE UNIQUE INDEX `cart_user_id_part_id_key` ON `cart`(`id_user`, `part_id`);
