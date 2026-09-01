<?php
/** Équivalent de src/app/espace-auteur/avis/page.tsx. */
require __DIR__ . '/../partials/author-shell-open.php';
?>
  <?= \App\Support\View::island('AuthorReviews') ?>
<?php require __DIR__ . '/../partials/author-shell-close.php'; ?>
