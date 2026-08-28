<?php
/** Équivalent de src/app/page.tsx.
 * @var array $topRatedBooks
 * @var array $latestBooks
 * @var array $categories
 */

use App\Support\View;

$bookCard = __DIR__ . '/../partials/book-card.php';
?>
<!-- Hero -->
<section class="relative overflow-hidden border-b border-black/5 dark:border-white/5">
  <div
    class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_srgb,var(--color-brand-amber)_18%,transparent),transparent)]"
  ></div>

  <div class="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
    <span class="rounded-full border border-brand-amber/30 bg-brand-amber/10 px-4 py-1 text-xs font-medium text-brand-amber">
      Nouveau · Gagnez des points sans même créer de compte
    </span>

    <h1 class="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl" style="font-family: var(--font-serif)">
      Les histoires africaines,
      <span class="text-brand-amber">racontées sans limites</span>
    </h1>

    <p class="max-w-xl text-balance text-base opacity-70 sm:text-lg">
      Romans, séries et drames signés par des auteurs africains. Lisez, gagnez des points au fil de vos lectures et débloquez de nouveaux chapitres.
    </p>

    <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
      <a
        href="/livres"
        class="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white no-underline shadow-lg shadow-black/10 transition hover:scale-[1.03] hover:shadow-xl dark:bg-white dark:text-neutral-900"
      >Explorer le catalogue</a>
      <a
        href="/rabipek-drama"
        class="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold no-underline transition hover:border-brand-amber hover:text-brand-amber dark:border-white/15"
      >Découvrir RabipekDrama</a>
    </div>
  </div>
</section>

<!-- Catégories -->
<?php if ($categories !== []): ?>
<section class="mx-auto max-w-6xl px-4 py-8">
  <div class="scrollbar-none flex gap-2 overflow-x-auto pb-1">
    <?php foreach ($categories as $category): ?>
      <a
        href="/livres?categoryId=<?= (int) ($category['id'] ?? 0) ?>"
        class="shrink-0 rounded-full border border-black/10 px-4 py-1.5 text-sm no-underline transition hover:border-brand-amber hover:text-brand-amber dark:border-white/10"
      ><?= View::e($category['name'] ?? '') ?></a>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>

<!-- Nouveautés -->
<?php if ($latestBooks !== []): ?>
<section class="mx-auto max-w-6xl px-4 py-10">
  <div class="mb-6 flex items-end justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Nouveautés</h2>
      <p class="text-sm opacity-60">Fraîchement publiés par nos auteurs</p>
    </div>
    <a href="/livres" class="shrink-0 text-sm font-medium text-brand-amber no-underline hover:underline">Tout voir &rarr;</a>
  </div>

  <div class="scrollbar-none -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:overflow-visible sm:px-0">
    <?php foreach ($latestBooks as $book): require $bookCard; endforeach; ?>
  </div>
</section>
<?php endif; ?>

<!-- Comment ça marche -->
<section class="border-y border-black/5 bg-neutral-50 dark:border-white/5 dark:bg-white/[0.02]">
  <div class="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3">
    <div class="flex flex-col gap-2">
      <span class="text-2xl">📖</span>
      <h3 class="font-semibold">Lisez librement</h3>
      <p class="text-sm opacity-70">Parcourez le catalogue et démarrez la lecture, avec ou sans compte.</p>
    </div>
    <div class="flex flex-col gap-2">
      <span class="text-2xl">✨</span>
      <h3 class="font-semibold">Gagnez des points</h3>
      <p class="text-sm opacity-70">Check-in quotidien, temps de lecture, articles lus : les points s'accumulent, même en visiteur.</p>
    </div>
    <div class="flex flex-col gap-2">
      <span class="text-2xl">🔓</span>
      <h3 class="font-semibold">Débloquez la suite</h3>
      <p class="text-sm opacity-70">Utilisez vos points pour ouvrir de nouveaux chapitres sans dépenser un centime.</p>
    </div>
  </div>
</section>

<!-- Les mieux notés -->
<?php if ($topRatedBooks !== []): ?>
<section class="mx-auto max-w-6xl px-4 py-10">
  <div class="mb-6 flex items-end justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Les mieux notés</h2>
      <p class="text-sm opacity-60">Plébiscités par la communauté</p>
    </div>
    <a href="/livres" class="shrink-0 text-sm font-medium text-brand-amber no-underline hover:underline">Tout voir &rarr;</a>
  </div>

  <div class="scrollbar-none -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:overflow-visible sm:px-0">
    <?php foreach ($topRatedBooks as $book): require $bookCard; endforeach; ?>
  </div>
</section>
<?php else: ?>
<section class="mx-auto max-w-6xl px-4 py-10">
  <p class="opacity-60">Aucun livre à afficher pour le moment (API indisponible ou catalogue vide).</p>
</section>
<?php endif; ?>

<!-- CTA RabipekDrama -->
<section class="mx-auto max-w-6xl px-4 pb-16">
  <div class="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 px-6 py-12 text-center text-white sm:flex-row sm:justify-between sm:text-left dark:from-white dark:to-neutral-200 dark:text-neutral-900">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">RabipekDrama</h2>
      <p class="mt-1 text-sm opacity-80">Les mêmes histoires, en formats courts et immersifs.</p>
    </div>
    <a
      href="/rabipek-drama"
      class="shrink-0 rounded-full bg-brand-amber px-6 py-3 text-sm font-semibold text-neutral-900 no-underline transition hover:scale-[1.03]"
    >Découvrir</a>
  </div>
</section>
