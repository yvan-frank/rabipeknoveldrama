<?php
/**
 * Fiche livre — orientée conversion (lecture immédiate + achat) plutôt que
 * simple fiche technique. Équivalent de src/app/livres/[slug]/page.tsx.
 * @var array|null $book
 * @var string $playStoreUrl
 * @var string|null $appStoreUrl
 */

use App\Support\View;

$isFree = (bool) ($book['isFree'] ?? false);
$isPromotion = (bool) ($book['isPromotion'] ?? false);
$price = (int) ($book['price'] ?? 0);
$promotionPrice = (int) ($book['promotionPrice'] ?? 0);
$averageRating = (float) ($book['averageRating'] ?? 0);
$reviewCount = (int) ($book['reviewCount'] ?? 0);
$viewCount = (int) ($book['viewCount'] ?? 0);
$likeCount = (int) ($book['likeCount'] ?? 0);
$chapters = $book['chapters'] ?? [];
$chapterCount = count($chapters);
$firstChapterNumber = $chapterCount > 0 ? min(array_column($chapters, 'chapterNumber')) : null;
$topics = array_filter(array_map('trim', explode(',', (string) ($book['extension']['topics'] ?? ''))));
$authorName = $book['author']['name'] ?? null;

function stars_markup(float $rating): string
{
    $rounded = (int) round($rating);
    return str_repeat('★', max(0, min(5, $rounded))) . str_repeat('☆', 5 - max(0, min(5, $rounded)));
}
?>
<article>
  <!-- Hero : couverture + argumentaire + CTA principal, au-dessus de la ligne de flottaison. -->
  <section class="relative overflow-hidden border-b border-black/10 dark:border-white/10">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-amber/10 via-transparent to-brand-pink/10"></div>
    <?php if (!empty($book['cover'])): ?>
      <div
        class="pointer-events-none absolute inset-0 opacity-25 blur-3xl dark:opacity-20"
        style="background-image:url('<?= View::e($book['cover']) ?>');background-size:cover;background-position:center;"
      ></div>
    <?php endif; ?>

    <div class="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 md:flex-row md:items-center md:gap-12">
      <div class="mx-auto w-48 shrink-0 sm:w-56 md:mx-0">
        <div class="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
          <?php if (!empty($book['cover'])): ?>
            <img src="<?= View::e($book['cover']) ?>" alt="Couverture de <?= View::e($book['title'] ?? '') ?>" class="size-full object-cover">
          <?php else: ?>
            <div class="flex size-full items-center justify-center text-5xl opacity-20">📖</div>
          <?php endif; ?>
          <?php if ($isFree): ?>
            <span class="absolute top-2.5 left-2.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">Gratuit</span>
          <?php elseif ($isPromotion): ?>
            <span class="absolute top-2.5 left-2.5 rounded-full bg-brand-pink px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">En promotion</span>
          <?php endif; ?>
        </div>
      </div>

      <div class="min-w-0 flex-1 text-center md:text-left">
        <?php if (!empty($book['category']['name'])): ?>
          <span class="inline-block rounded-full bg-brand-amber/15 px-3 py-1 text-xs font-semibold tracking-wide text-brand-amber uppercase">
            <?= View::e($book['category']['name']) ?>
          </span>
        <?php endif; ?>

        <h1 class="mt-3 font-serif text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
          <?= View::e($book['title'] ?? '') ?>
        </h1>

        <?php if ($authorName): ?>
          <p class="mt-2.5 flex items-center justify-center gap-2 text-sm opacity-75 md:justify-start">
            <?php if (!empty($book['author']['image'])): ?>
              <img src="<?= View::e($book['author']['image']) ?>" alt="" class="size-6 rounded-full object-cover">
            <?php endif; ?>
            Par <span class="font-medium"><?= View::e($authorName) ?></span>
          </p>
        <?php endif; ?>

        <div class="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm opacity-80 md:justify-start">
          <?php if ($reviewCount > 0): ?>
            <span class="flex items-center gap-1">
              <span class="tracking-wide text-brand-amber"><?= stars_markup($averageRating) ?></span>
              <span><?= number_format($averageRating, 1, ',', ' ') ?> (<?= $reviewCount ?> avis)</span>
            </span>
          <?php endif; ?>
          <span>👁 <?= number_format($viewCount, 0, ',', ' ') ?> lectures</span>
          <span>♥ <?= number_format($likeCount, 0, ',', ' ') ?> j'aime</span>
          <?php if (!empty($book['pageNumber'])): ?>
            <span><?= (int) $book['pageNumber'] ?> pages</span>
          <?php endif; ?>
          <?php if ($chapterCount > 0): ?>
            <span><?= $chapterCount ?> chapitre<?= $chapterCount > 1 ? 's' : '' ?></span>
          <?php endif; ?>
        </div>

        <?php if (!empty($book['resume'])): ?>
          <p class="mx-auto mt-5 max-w-xl text-sm leading-relaxed opacity-80 md:mx-0">
            <?= View::e(mb_strlen(strip_tags((string) $book['resume'])) > 220 ? mb_substr(strip_tags((string) $book['resume']), 0, 217) . '…' : strip_tags((string) $book['resume'])) ?>
          </p>
        <?php endif; ?>

        <div class="mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <?php if ($firstChapterNumber !== null): ?>
            <a
              href="/livres/<?= View::e($book['slug'] ?? '') ?>/chapitres/<?= View::e((string) $firstChapterNumber) ?>"
              class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-6 py-3 text-sm font-semibold text-white no-underline shadow-[0_10px_30px_-8px_rgba(245,158,11,0.6)] transition hover:scale-[1.03]"
            >
              ▶ Commencer à lire
            </a>
          <?php endif; ?>

          <?php if (!$isFree): ?>
            <div class="flex items-baseline gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold dark:border-white/10">
              <?php if ($isPromotion): ?>
                <span class="opacity-45 line-through"><?= number_format($price, 0, ',', ' ') ?> FCFA</span>
                <span class="text-brand-pink"><?= number_format($promotionPrice, 0, ',', ' ') ?> FCFA</span>
              <?php else: ?>
                <span><?= number_format($price, 0, ',', ' ') ?> FCFA</span>
              <?php endif; ?>
            </div>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </section>

  <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <div class="grid gap-10 md:grid-cols-[1fr_20rem]">
      <div class="min-w-0">
        <?php if ($topics !== []): ?>
          <div class="mb-8 flex flex-wrap gap-2">
            <?php foreach ($topics as $topic): ?>
              <span class="rounded-full border border-black/10 px-3 py-1 text-xs font-medium opacity-75 dark:border-white/10">#<?= View::e($topic) ?></span>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

        <?php if (!empty($book['extension']['introduction'])): ?>
          <p class="mb-6 border-l-4 border-brand-amber pl-4 font-serif text-lg leading-relaxed opacity-90 italic">
            <?= nl2br(View::e($book['extension']['introduction'])) ?>
          </p>
        <?php endif; ?>

        <?php if (!empty($book['resume'])): ?>
          <section class="mb-10">
            <h2 class="mb-3 font-serif text-xl font-bold">Résumé</h2>
            <p class="leading-relaxed opacity-85"><?= nl2br(View::e($book['resume'])) ?></p>
          </section>
        <?php endif; ?>

        <section class="mb-10">
          <h2 class="mb-1 font-serif text-xl font-bold">Sommaire</h2>
          <p class="mb-4 text-sm opacity-60">La lecture se fait dans l'app RabipekNovel — touchez un chapitre pour l'ouvrir.</p>
          <?php if ($chapters === []): ?>
            <p class="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-sm opacity-60 dark:border-white/15">
              Aucun chapitre publié pour le moment — revenez bientôt !
            </p>
          <?php else: ?>
            <ol class="flex flex-col gap-2">
              <?php foreach ($chapters as $chapter): ?>
                <li>
                  <a
                    href="/livres/<?= View::e($book['slug'] ?? '') ?>/chapitres/<?= View::e((string) ($chapter['chapterNumber'] ?? '')) ?>"
                    class="group flex items-center gap-3 rounded-xl border border-black/10 px-4 py-3 no-underline transition hover:border-brand-amber/40 hover:bg-brand-amber/5 dark:border-white/10"
                  >
                    <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-semibold dark:bg-white/10">
                      <?= View::e((string) ($chapter['chapterNumber'] ?? '')) ?>
                    </span>
                    <span class="min-w-0 flex-1 truncate text-sm font-medium"><?= View::e($chapter['title'] ?? ('Chapitre ' . ($chapter['chapterNumber'] ?? ''))) ?></span>
                    <span class="shrink-0 text-brand-amber opacity-0 transition group-hover:opacity-100">→</span>
                  </a>
                </li>
              <?php endforeach; ?>
            </ol>
          <?php endif; ?>
        </section>

        <section class="mb-10">
          <?= View::island('ReviewForm', ['bookId' => $book['id'] ?? null]) ?>
        </section>
      </div>

      <aside class="flex flex-col gap-6">
        <div class="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <?= View::island('BookActions', [
              'bookId' => $book['id'] ?? null,
              'isFree' => $isFree,
              'price' => $price,
              'isPromotion' => $isPromotion,
              'promotionPrice' => $promotionPrice,
              'likeCount' => $likeCount,
              'isLikedByUser' => $book['isLikedByUser'] ?? false,
              'parts' => $book['parts'] ?? [],
          ]) ?>
        </div>

        <?php if ($authorName): ?>
          <div class="rounded-2xl border border-black/10 p-5 dark:border-white/10">
            <p class="mb-3 text-[0.7rem] font-semibold tracking-[0.12em] uppercase opacity-50">L'auteur·e</p>
            <div class="flex items-center gap-3">
              <?php if (!empty($book['author']['image'])): ?>
                <img src="<?= View::e($book['author']['image']) ?>" alt="" class="size-12 shrink-0 rounded-full object-cover">
              <?php else: ?>
                <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-lg dark:bg-white/10">✍️</div>
              <?php endif; ?>
              <div class="min-w-0">
                <p class="truncate font-semibold"><?= View::e($authorName) ?></p>
                <?php if (!empty($book['author']['designation'])): ?>
                  <p class="truncate text-xs opacity-60"><?= View::e($book['author']['designation']) ?></p>
                <?php endif; ?>
              </div>
            </div>
            <?php if (!empty($book['author']['about'])): ?>
              <p class="mt-3 line-clamp-4 text-sm leading-relaxed opacity-75"><?= View::e($book['author']['about']) ?></p>
            <?php endif; ?>
          </div>
        <?php endif; ?>

        <div class="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 text-white">
          <p class="text-sm font-semibold">Lisez sans limites</p>
          <p class="mt-1 text-xs opacity-70">L'app RabipekNovel : téléchargements hors-ligne, karaoké audio, et tout votre catalogue préféré.</p>
          <div class="mt-4 flex flex-col gap-2">
            <a href="<?= View::e($playStoreUrl) ?>" class="rounded-lg bg-brand-amber px-4 py-2 text-center text-xs font-semibold text-neutral-900 no-underline transition hover:scale-[1.02]">
              Télécharger sur Google Play
            </a>
            <?php if ($appStoreUrl): ?>
              <a href="<?= View::e($appStoreUrl) ?>" class="rounded-lg border border-white/20 px-4 py-2 text-center text-xs font-semibold no-underline transition hover:bg-white/10">
                Télécharger sur l'App Store
              </a>
            <?php endif; ?>
          </div>
        </div>
      </aside>
    </div>
  </div>
</article>
