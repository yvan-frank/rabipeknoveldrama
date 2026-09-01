<?php
/** Équivalent de src/app/espace-auteur/{layout,page}.tsx. */
require __DIR__ . '/../partials/author-shell-open.php';
?>
  <?= \App\Support\View::island('AuthorOverview') ?>
<?php require __DIR__ . '/../partials/author-shell-close.php'; ?>
