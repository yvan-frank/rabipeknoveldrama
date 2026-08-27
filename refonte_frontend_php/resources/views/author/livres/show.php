<?php
/**
 * Équivalent de src/app/espace-auteur/livres/[id]/page.tsx (BookManageDashboard).
 * @var string $bookId
 */
?>
<section class="section">
  <?= \App\Support\View::island('BookManageDashboard', ['bookId' => $bookId]) ?>
</section>
