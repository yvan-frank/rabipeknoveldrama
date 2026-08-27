<?php /** Équivalent de src/app/espace-auteur/avis/page.tsx. */ ?>
<section class="mx-auto max-w-6xl p-4">
  <h1>Avis reçus</h1>
  <?= \App\Support\View::island('AuthorReviews', []) ?>
</section>
