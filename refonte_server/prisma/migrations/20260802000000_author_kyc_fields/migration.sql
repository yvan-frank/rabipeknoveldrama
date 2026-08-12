-- KYC auteur : type de pièce d'identité et date d'acceptation de la
-- politique de confidentialité (les autres champs KYC existaient déjà).
ALTER TABLE `author_extension`
  ADD COLUMN `document_type` VARCHAR(20) NULL,
  ADD COLUMN `privacy_accepted_at` DATETIME(3) NULL;
