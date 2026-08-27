<?php /** Équivalent de src/app/espace-auteur/{layout,page}.tsx. @var array $user */ ?>
<section class="section author-dashboard">
  <div class="author-dashboard__header">
    <h1>Espace auteur</h1>
    <a href="/espace-auteur/livres/nouveau" class="btn btn--primary">Nouveau livre</a>
  </div>
  <?= \App\Support\View::island('AuthorOverview', []) ?>
</section>
