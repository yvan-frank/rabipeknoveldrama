<?php
/** Équivalent de src/app/espace-auteur/statistiques/page.tsx. */
require __DIR__ . '/../partials/author-shell-open.php';
?>
  <?= \App\Support\View::island('AuthorStats') ?>
<?php require __DIR__ . '/../partials/author-shell-close.php'; ?>
