<?php
/** Équivalent de src/app/livres/[slug]/page.tsx. @var array|null $book */

use App\Support\View;
?>
<article class="section book-page">
  <div class="book-page__head">
    <?php if (!empty($book['cover'])): ?>
      <img src="<?= View::e($book['cover']) ?>" alt="Couverture de <?= View::e($book['title'] ?? '') ?>" class="book-page__cover" />
    <?php endif; ?>
    <div class="book-page__intro">
      <h1><?= View::e($book['title'] ?? '') ?></h1>
      <p class="book-page__synopsis"><?= nl2br(View::e($book['resume'] ?? '')) ?></p>
    </div>
  </div>

  <?= View::island('BookActions', [
      'bookId' => $book['id'] ?? null,
      'isFree' => $book['isFree'] ?? false,
      'price' => $book['price'] ?? 0,
      'isPromotion' => $book['isPromotion'] ?? false,
      'promotionPrice' => $book['promotionPrice'] ?? 0,
      'likeCount' => $book['likeCount'] ?? 0,
      'isLikedByUser' => $book['isLikedByUser'] ?? false,
      'parts' => $book['parts'] ?? [],
  ]) ?>

  <h2>Chapitres</h2>
  <p class="book-page__app-notice">La lecture se fait dans l'app RabipekNovel — cliquez un chapitre pour l'ouvrir.</p>
  <?php if (empty($book['chapters'])): ?>
    <p class="empty">Aucun chapitre publié pour le moment.</p>
  <?php else: ?>
    <ol class="chapter-list">
      <?php foreach ($book['chapters'] as $chapter): ?>
        <li>
          <a href="/livres/<?= View::e($book['slug'] ?? '') ?>/chapitres/<?= View::e((string) ($chapter['chapterNumber'] ?? '')) ?>">
            <?= View::e($chapter['title'] ?? ('Chapitre ' . ($chapter['chapterNumber'] ?? ''))) ?>
          </a>
        </li>
      <?php endforeach; ?>
    </ol>
  <?php endif; ?>

  <?= View::island('ReviewForm', ['bookId' => $book['id'] ?? null]) ?>
</article>
