<?php /** Équivalent de src/app/espace-auteur/livres/nouveau/page.tsx (BookWizard). */ ?>
<section class="mx-auto max-w-6xl p-4">
  <h1>Nouveau livre</h1>
  <p class="mt-1 mb-4 text-sm opacity-60">Publiez un nouveau livre en quelques étapes.</p>
  <?= \App\Support\View::island('BookWizard', []) ?>
</section>
