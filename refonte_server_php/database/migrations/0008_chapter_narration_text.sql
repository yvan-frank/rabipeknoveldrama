-- L'API TTS renvoie désormais aussi le texte source tel qu'envoyé au service
-- (tirets de dialogue, sauts de ligne préservés) + char_start/char_end par
-- mot dans WordTimestamp, pour caler le surlignage karaoké sur ce texte
-- plutôt que de le reconstruire en concaténant les mots avec des espaces
-- (perd la mise en forme d'origine).
ALTER TABLE `chapter_narrations`
  ADD COLUMN `source_text` longtext DEFAULT NULL AFTER `audio_url`;
