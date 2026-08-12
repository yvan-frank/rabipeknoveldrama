-- Le lien du fichier téléchargeable devient facultatif : un livre peut être
-- géré entièrement via la lecture intégrée (chapitres), sans fichier externe.
ALTER TABLE `books` MODIFY `book_link` TEXT NULL;
