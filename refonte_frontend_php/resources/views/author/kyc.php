<?php
/** Équivalent de src/app/espace-auteur/kyc/page.tsx. */
require __DIR__ . '/../partials/author-shell-open.php';
?>
  <?= \App\Support\View::island('KycForm') ?>
<?php require __DIR__ . '/../partials/author-shell-close.php'; ?>
