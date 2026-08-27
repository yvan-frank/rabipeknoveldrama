<?php /** Équivalent de src/app/espace-auteur/parametres/page.tsx. */ ?>
<section class="mx-auto max-w-6xl p-4">
  <h1>Paramètres auteur</h1>
  <?= \App\Support\View::island('AuthorSettingsForm', []) ?>
</section>
