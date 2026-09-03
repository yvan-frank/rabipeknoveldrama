-- Narration audio générée via l'API TTS Karaoké externe (Piper + WhisperX) :
-- un job par chapitre (régénérer écrase l'entrée précédente), avec le statut
-- du job externe, l'URL audio et les timestamps par mot une fois terminé.
CREATE TABLE IF NOT EXISTS `chapter_narrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_id` int(11) NOT NULL,
  `status` enum('pending','processing','done','error') NOT NULL DEFAULT 'pending',
  `tts_job_id` varchar(100) DEFAULT NULL,
  `voice` varchar(255) DEFAULT NULL,
  `speed` decimal(3,2) DEFAULT NULL,
  `audio_url` varchar(1000) DEFAULT NULL,
  `words_json` longtext DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `chapter_narrations_chapter_id_key` (`chapter_id`),
  CONSTRAINT `chapter_narrations_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id_chapter`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
