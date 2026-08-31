<?php /** Équivalent de src/app/espace-auteur/{layout,page}.tsx. */ ?>
<section class="mx-auto max-w-6xl p-4">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <h1>Espace auteur</h1>
    <a href="/espace-auteur/livres/nouveau" class="inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white no-underline dark:bg-neutral-100 dark:text-neutral-900">Nouveau livre</a>
  </div>
  <?= \App\Support\View::island('AuthorOverview', []) ?>
</section>
