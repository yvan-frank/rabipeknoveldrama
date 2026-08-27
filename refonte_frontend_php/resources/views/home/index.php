<?php
/** Équivalent de src/app/page.tsx. @var array $topRatedBooks */

use App\Support\View;
?>
<section class="hero">
  <h1>Livres africains en ligne</h1>
  <p>Découvrez des livres, des auteurs et des histoires africaines sur RabipekNovel.</p>
  <a href="/livres" class="btn btn--primary">Explorer le catalogue</a>
</section>

<section class="section">
  <h2>Les mieux notés</h2>
  <?php if ($topRatedBooks === []): ?>
    <p class="empty">Aucun livre à afficher pour le moment (API indisponible ou catalogue vide).</p>
  <?php else: ?>
    <div class="book-grid">
      <?php foreach ($topRatedBooks as $book): ?>
        <a href="/livres/<?= View::e($book['slug'] ?? '') ?>" class="book-card">
          <?php if (!empty($book['cover'])): ?>
            <img src="<?= View::e($book['cover']) ?>" alt="<?= View::e($book['title'] ?? '') ?>">
          <?php endif; ?>
          <span class="book-card__title"><?= View::e($book['title'] ?? '') ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>
