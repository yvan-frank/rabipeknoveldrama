-- Nouveau statut renvoyé par l'API TTS après POST /generate/{job_id}/cancel.
ALTER TABLE `chapter_narrations`
  MODIFY COLUMN `status` enum('pending','processing','done','error','cancelled') NOT NULL DEFAULT 'pending';
