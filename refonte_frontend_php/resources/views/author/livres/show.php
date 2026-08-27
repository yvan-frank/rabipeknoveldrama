<?php
/**
 * Équivalent de src/app/espace-auteur/livres/[id]/page.tsx (BookManageDashboard).
 * @var string $bookId
 */
?>
<section class="mx-auto max-w-6xl p-4">
  <?= \App\Support\View::island('BookManageDashboard', ['bookId' => $bookId]) ?>
</section>
