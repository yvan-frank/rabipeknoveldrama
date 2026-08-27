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
<section class="section">
  <h1>Catalogue</h1>

  <?= View::island('BookFilters', ['action' => '/livres', 'query' => $query]) ?>

  <?php if ($books === []): ?>
    <p class="empty">Aucun livre trouvé.</p>
  <?php else: ?>
    <div class="book-grid">
      <?php foreach ($books as $book): ?>
        <a href="/livres/<?= View::e($book['slug'] ?? '') ?>" class="book-card">
          <?php if (!empty($book['cover'])): ?>
            <img src="<?= View::e($book['cover']) ?>" alt="<?= View::e($book['title'] ?? '') ?>">
          <?php endif; ?>
          <span class="book-card__title"><?= View::e($book['title'] ?? '') ?></span>
        </a>
      <?php endforeach; ?>
    </div>

    <?php if ($totalPages > 1): ?>
      <nav class="pagination">
        <?php if ($page > 1): ?>
          <a href="<?= View::e($pageLink($page - 1)) ?>">&larr; Précédent</a>
        <?php endif; ?>
        <span><?= $page ?> / <?= $totalPages ?></span>
        <?php if ($page < $totalPages): ?>
          <a href="<?= View::e($pageLink($page + 1)) ?>">Suivant &rarr;</a>
        <?php endif; ?>
      </nav>
    <?php endif; ?>
  <?php endif; ?>
</section>
