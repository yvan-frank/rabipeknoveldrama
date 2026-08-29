-- Un compte soft-supprimé (deleted_at) gardait son email intact : la
-- contrainte unique `users_email_key`/`author_email_key` porte sur `email`
-- seul (aucune exception pour deleted_at, cf. AuthService::findAnyUserByEmail),
-- donc cet email restait à jamais indisponible pour une réinscription — même
-- pour la personne qui a supprimé le compte. On libère les lignes déjà
-- supprimées ici ; UsersService::softDeleteUser / AuthorsService::softDeleteAuthor
-- font désormais de même pour les suppressions futures.
UPDATE `users`
SET `email` = CONCAT('deleted_', `id_user`, '_', UNIX_TIMESTAMP(`deleted_at`), '_', LEFT(`email`, 90))
WHERE `deleted_at` IS NOT NULL AND `email` IS NOT NULL;

UPDATE `author`
SET `email` = CONCAT('deleted_', `id_author`, '_', UNIX_TIMESTAMP(`deleted_at`), '_', LEFT(`email`, 90))
WHERE `deleted_at` IS NOT NULL;
