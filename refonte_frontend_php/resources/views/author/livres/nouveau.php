<?php /** Équivalent de src/app/espace-auteur/livres/nouveau/page.tsx (BookWizard). */ ?>
<section class="section">
  <h1>Nouveau livre</h1>
  <p class="dashboard-panel__description">Publiez un nouveau livre en quelques étapes.</p>
  <?= \App\Support\View::island('BookWizard', []) ?>
</section>
