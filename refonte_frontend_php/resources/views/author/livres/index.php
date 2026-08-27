<?php /** Équivalent de src/app/espace-auteur/livres/page.tsx. */ ?>
<section class="section">
  <h1>Mes livres</h1>
  <a href="/espace-auteur/livres/nouveau" class="btn btn--primary">Nouveau livre</a>
  <?= \App\Support\View::island('AuthorBooksList', []) ?>
</section>
