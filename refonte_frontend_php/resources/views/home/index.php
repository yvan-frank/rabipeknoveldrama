<?php
/** Équivalent de src/app/page.tsx. @var array $topRatedBooks */

use App\Support\View;
?>
<section class="px-4 py-16 text-center">
  <h1>Livres africains en ligne</h1>
  <p>Découvrez des livres, des auteurs et des histoires africaines sur RabipekNovel.</p>
  <a href="/livres" class="mt-4 inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white no-underline dark:bg-neutral-100 dark:text-neutral-900">Explorer le catalogue</a>
</section>

<section class="mx-auto max-w-6xl p-4">
  <h2>Les mieux notés</h2>
  <?php if ($topRatedBooks === []): ?>
    <p class="opacity-60">Aucun livre à afficher pour le moment (API indisponible ou catalogue vide).</p>
  <?php else: ?>
    <div class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
      <?php foreach ($topRatedBooks as $book): ?>
        <a href="/livres/<?= View::e($book['slug'] ?? '') ?>" class="flex flex-col gap-2 no-underline">
          <?php if (!empty($book['cover'])): ?>
            <img src="<?= View::e($book['cover']) ?>" alt="<?= View::e($book['title'] ?? '') ?>" class="aspect-[2/3] w-full rounded-lg object-cover">
          <?php endif; ?>
          <span class="text-sm font-medium"><?= View::e($book['title'] ?? '') ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>
