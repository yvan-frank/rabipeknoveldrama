-- Voix distincte pour les répliques de dialogue (paragraphes commençant par
-- un tiret cadratin), nouveau paramètre optionnel de l'API TTS Karaoké.
ALTER TABLE `chapter_narrations`
  ADD COLUMN `dialogue_voice` varchar(255) DEFAULT NULL AFTER `voice`;
