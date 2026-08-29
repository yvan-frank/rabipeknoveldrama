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

// La mise en avant (vedette + "À lire aussi") n'a de sens que sur la vue par
// défaut du catalogue — un résultat de recherche/filtre reste une simple
// grille, la curation éditoriale n'y a pas sa place.
$isDefaultView = $page <= 1
    && empty($query['search'])
    && empty($query['categoryId'])
    && empty($query['authorId'])
    && !isset($query['isFree']);

$featured = [];
$alsoRead = [];
$gridBooks = $books;

if ($isDefaultView && count($books) >= 3) {
    $featured = array_slice($books, 0, 2);
    $alsoRead = array_slice($books, 2, 5);
    $gridBooks = array_slice($books, 7);
}

$bookCard = __DIR__ . '/../partials/book-card.php';
?>
<section class="mx-auto max-w-6xl px-4 pt-10 pb-4 text-center">
  <span class="inline-block rounded-full bg-brand-amber/10 px-4 py-1 text-xs font-medium text-brand-amber">Catalogue</span>
  <h1 class="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" style="font-family: var(--font-serif)">
    Votre prochaine lecture vous attend
  </h1>
  <p class="mx-auto mt-2 max-w-xl text-sm opacity-60">
    <?= number_format($total, 0, ',', ' ') ?> romans et drames africains, gratuits ou à débloquer avec vos points.
  </p>
</section>

<?php if ($featured !== []): ?>
<section class="mx-auto max-w-6xl px-4 py-6">
  <div class="grid gap-5 <?= count($featured) > 1 ? 'sm:grid-cols-2' : '' ?>">
    <?php foreach ($featured as $book):
      $categoryName = $book['category']['name'] ?? null;
      $authorName = $book['author']['name'] ?? null;
      $isFree = (bool) ($book['isFree'] ?? false);
    ?>
      <a
        href="/livres/<?= View::e($book['slug'] ?? '') ?>"
        class="group relative flex min-h-56 items-end overflow-hidden rounded-2xl bg-neutral-900 no-underline shadow-lg"
      >
        <?php if (!empty($book['cover'])): ?>
          <img
            src="<?= View::e($book['cover']) ?>"
            alt=""
            class="absolute inset-0 size-full object-cover opacity-50 transition duration-500 group-hover:scale-105 group-hover:opacity-60"
          >
        <?php endif; ?>
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

        <div class="relative z-10 flex flex-col gap-1.5 p-6 text-white">
          <span class="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-amber/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-900">
            ✨ En vedette
          </span>
          <?php if ($categoryName): ?>
            <span class="text-xs font-medium uppercase tracking-wide text-white/70"><?= View::e($categoryName) ?></span>
          <?php endif; ?>
          <h2 class="text-xl font-bold leading-snug sm:text-2xl"><?= View::e($book['title'] ?? '') ?></h2>
          <?php if ($authorName): ?>
            <p class="text-sm text-white/70">par <?= View::e($authorName) ?></p>
          <?php endif; ?>
          <span class="mt-2 inline-flex w-fit items-center gap-1 text-sm font-semibold text-brand-amber">
            <?= $isFree ? 'Lire gratuitement' : 'Découvrir' ?> &rarr;
          </span>
        </div>
      </a>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>

<?php if ($alsoRead !== []): ?>
<section class="mx-auto max-w-6xl px-4 py-6">
  <h2 class="mb-4 text-lg font-bold tracking-tight">À lire aussi</h2>
  <div class="scrollbar-none -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
    <?php foreach ($alsoRead as $book): require $bookCard; endforeach; ?>
  </div>
</section>
<?php endif; ?>

<section class="mx-auto max-w-6xl px-4 py-6">
  <?php if ($featured !== []): ?>
    <h2 class="mb-4 text-lg font-bold tracking-tight">Tout le catalogue</h2>
  <?php endif; ?>

  <?php
  /* Îlot React "BookFilters" retiré : pas nécessaire pour le moment.
  <?= View::island('BookFilters', ['action' => '/livres', 'query' => $query]) ?>
  */
  ?>

  <?php if ($gridBooks === []): ?>
    <p class="opacity-60">Aucun livre trouvé.</p>
  <?php else: ?>
    <div class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
      <?php foreach ($gridBooks as $book): require $bookCard; endforeach; ?>
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
