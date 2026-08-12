-- Vérification KYC par un administrateur, distincte de la complétude
-- déclarative du formulaire (cf. AuthorExtension.privacyAcceptedAt et
-- consorts). C'est ce champ qui conditionne réellement l'accès aux actions
-- d'écriture d'un auteur.
ALTER TABLE `author_extension`
  ADD COLUMN `kyc_verified_at` DATETIME(3) NULL;
