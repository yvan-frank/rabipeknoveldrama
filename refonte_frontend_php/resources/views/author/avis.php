<?php /** Équivalent de src/app/espace-auteur/avis/page.tsx. */ ?>
<section class="section">
  <h1>Avis reçus</h1>
  <?= \App\Support\View::island('AuthorReviews', []) ?>
</section>
