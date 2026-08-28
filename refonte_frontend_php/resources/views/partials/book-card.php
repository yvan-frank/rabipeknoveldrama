<?php
/**
 * Carte livre réutilisable — @var array $book (forme App\Modules\Books\BooksService::mapListRow).
 */

use App\Support\View;

$price = (int) ($book['price'] ?? 0);
$isFree = (bool) ($book['isFree'] ?? false);
$isPromotion = (bool) ($book['isPromotion'] ?? false);
$promotionPrice = (int) ($book['promotionPrice'] ?? 0);
$categoryName = $book['category']['name'] ?? null;
$authorName = $book['author']['name'] ?? null;
?>
<a
  href="/livres/<?= View::e($book['slug'] ?? '') ?>"
  class="group flex w-40 shrink-0 flex-col gap-2.5 no-underline sm:w-44"
>
  <div class="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-100 shadow-sm ring-1 ring-black/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg dark:bg-neutral-800 dark:ring-white/10">
    <?php if (!empty($book['cover'])): ?>
      <img
        src="<?= View::e($book['cover']) ?>"
        alt="<?= View::e($book['title'] ?? '') ?>"
        loading="lazy"
        class="size-full object-cover transition duration-300 group-hover:scale-105"
      >
    <?php else: ?>
      <div class="flex size-full items-center justify-center text-3xl opacity-20">📖</div>
    <?php endif; ?>

    <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100"></div>

    <?php if ($isFree): ?>
      <span class="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow">Gratuit</span>
    <?php elseif ($isPromotion): ?>
      <span class="absolute left-2 top-2 rounded-full bg-brand-pink px-2 py-0.5 text-[11px] font-semibold text-white shadow">Promo</span>
    <?php endif; ?>
  </div>

  <div class="flex flex-col gap-0.5">
    <?php if ($categoryName): ?>
      <span class="text-[11px] font-medium uppercase tracking-wide text-brand-amber"><?= View::e($categoryName) ?></span>
    <?php endif; ?>
    <span class="line-clamp-2 text-sm font-semibold leading-snug"><?= View::e($book['title'] ?? '') ?></span>
    <?php if ($authorName): ?>
      <span class="truncate text-xs opacity-60"><?= View::e($authorName) ?></span>
    <?php endif; ?>

    <?php if (!$isFree): ?>
      <span class="mt-1 text-xs font-medium">
        <?php if ($isPromotion): ?>
          <span class="mr-1.5 opacity-50 line-through"><?= number_format($price, 0, ',', ' ') ?></span>
          <span class="text-brand-pink"><?= number_format($promotionPrice, 0, ',', ' ') ?> FCFA</span>
        <?php else: ?>
          <?= number_format($price, 0, ',', ' ') ?> FCFA
        <?php endif; ?>
      </span>
    <?php endif; ?>
  </div>
</a>
