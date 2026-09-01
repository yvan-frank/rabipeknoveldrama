<?php
/** Équivalent de src/app/espace-auteur/livres/nouveau/page.tsx (BookWizard). */
require __DIR__ . '/../../partials/author-shell-open.php';
?>
  <?= \App\Support\View::island('BookWizard') ?>
<?php require __DIR__ . '/../../partials/author-shell-close.php'; ?>
