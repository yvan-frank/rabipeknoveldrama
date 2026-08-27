<?php
/**
 * Équivalent de src/app/livres/page.tsx.
 * @var array $books
 * @var int $total
 * @var int $page
 * @var int $pageSize
 * @var array<string,mixed> $query
 */

use App\Support\View;

$totalPages = $pageSize > 0 ? (int) ceil($total / $pageSize) : 1;

$pageLink = static fn (int $targetPage): string => '/livres?' . http_build_query([...$query, 'page' => $targetPage]);
?>
<section class="mx-auto max-w-6xl p-4">
  <h1>Catalogue</h1>

  <?= View::island('BookFilters', ['action' => '/livres', 'query' => $query]) ?>

  <?php if ($books === []): ?>
    <p class="opacity-60">Aucun livre trouvé.</p>
  <?php else: ?>
    <div class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
      <?php foreach ($books as $book): ?>
        <a href="/livres/<?= View::e($book['slug'] ?? '') ?>" class="flex flex-col gap-2 no-underline">
          <?php if (!empty($book['cover'])): ?>
            <img src="<?= View::e($book['cover']) ?>" alt="<?= View::e($book['title'] ?? '') ?>" class="aspect-[2/3] w-full rounded-lg object-cover">
          <?php endif; ?>
          <span class="text-sm font-medium"><?= View::e($book['title'] ?? '') ?></span>
        </a>
      <?php endforeach; ?>
    </div>

    <?php if ($totalPages > 1): ?>
      <nav class="mt-10 flex items-center justify-center gap-6 text-sm">
        <?php if ($page > 1): ?>
          <a href="<?= View::e($pageLink($page - 1)) ?>" class="text-brand-amber no-underline hover:underline">&larr; Précédent</a>
        <?php endif; ?>
        <span><?= $page ?> / <?= $totalPages ?></span>
        <?php if ($page < $totalPages): ?>
          <a href="<?= View::e($pageLink($page + 1)) ?>" class="text-brand-amber no-underline hover:underline">Suivant &rarr;</a>
        <?php endif; ?>
      </nav>
    <?php endif; ?>
  <?php endif; ?>
</section>
