<?php
/**
 * Équivalent de src/app/espace-auteur/livres/[id]/page.tsx (BookManageDashboard).
 * @var string $bookId
 */
require __DIR__ . '/../../partials/author-shell-open.php';
?>
  <?= \App\Support\View::island('BookManageDashboard', ['bookId' => $bookId]) ?>
<?php require __DIR__ . '/../../partials/author-shell-close.php'; ?>
