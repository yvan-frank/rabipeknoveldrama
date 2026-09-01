<?php
/** Équivalent de src/app/espace-auteur/livres/page.tsx. */
require __DIR__ . '/../../partials/author-shell-open.php';
?>
  <?= \App\Support\View::island('AuthorBooksList') ?>
<?php require __DIR__ . '/../../partials/author-shell-close.php'; ?>
