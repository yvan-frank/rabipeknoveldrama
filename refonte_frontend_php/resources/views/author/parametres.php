<?php
/** Équivalent de src/app/espace-auteur/parametres/page.tsx. */
require __DIR__ . '/../partials/author-shell-open.php';
?>
  <?= \App\Support\View::island('AuthorSettingsForm') ?>
<?php require __DIR__ . '/../partials/author-shell-close.php'; ?>
