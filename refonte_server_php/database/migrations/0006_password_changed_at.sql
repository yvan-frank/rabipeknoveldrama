-- Suivi de l'âge du mot de passe (POST /auth/change-password, politique
-- d'expiration à 180 jours pour les rôles user/author — cf. AuthService::login).
ALTER TABLE `users`
  ADD COLUMN `password_changed_at` datetime(3) DEFAULT NULL AFTER `password`;
ALTER TABLE `author`
  ADD COLUMN `password_changed_at` datetime(3) DEFAULT NULL AFTER `password`;

-- Backfill à NOW() plutôt qu'à `created_at` : la politique des 180 jours ne
-- doit s'appliquer qu'aux mots de passe changés APRÈS ce déploiement, pas
-- forcer instantanément une réinitialisation en masse de tous les comptes
-- déjà plus vieux que 180 jours (ce qui bloquerait leur prochaine connexion
-- sans prévenir).
UPDATE `users` SET `password_changed_at` = NOW() WHERE `password` IS NOT NULL;
UPDATE `author` SET `password_changed_at` = NOW();
