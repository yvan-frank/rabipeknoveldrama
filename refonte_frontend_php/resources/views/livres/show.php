<?php
/** Équivalent de src/app/livres/[slug]/page.tsx. @var array|null $book */

use App\Support\View;
?>
<article class="mx-auto max-w-6xl p-4">
  <div class="mb-6 flex flex-wrap gap-7">
    <?php if (!empty($book['cover'])): ?>
      <img
        src="<?= View::e($book['cover']) ?>"
        alt="Couverture de <?= View::e($book['title'] ?? '') ?>"
        class="aspect-[2/3] w-48 shrink-0 rounded-2xl object-cover shadow-[0_12px_30px_rgb(0_0_0/20%)]"
      />
    <?php endif; ?>
    <div class="min-w-64 flex-1">
      <h1 class="mt-0"><?= View::e($book['title'] ?? '') ?></h1>
      <p><?= nl2br(View::e($book['resume'] ?? '')) ?></p>
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
  <p class="-mt-2 text-sm opacity-65">La lecture se fait dans l'app RabipekNovel — cliquez un chapitre pour l'ouvrir.</p>
  <?php if (empty($book['chapters'])): ?>
    <p class="opacity-60">Aucun chapitre publié pour le moment.</p>
  <?php else: ?>
    <ol class="flex list-decimal flex-col gap-2 pl-5">
      <?php foreach ($book['chapters'] as $chapter): ?>
        <li>
          <a href="/livres/<?= View::e($book['slug'] ?? '') ?>/chapitres/<?= View::e((string) ($chapter['chapterNumber'] ?? '')) ?>" class="hover:underline">
            <?= View::e($chapter['title'] ?? ('Chapitre ' . ($chapter['chapterNumber'] ?? ''))) ?>
          </a>
        </li>
      <?php endforeach; ?>
    </ol>
  <?php endif; ?>

  <?= View::island('ReviewForm', ['bookId' => $book['id'] ?? null]) ?>
</article>
