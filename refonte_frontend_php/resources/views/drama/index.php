<?php
/**
 * Équivalent de src/app/rabipek-drama/page.tsx — une vitrine "bientôt
 * disponible" avec des épisodes factices (src/lib/mock-drama.ts), pas
 * encore une vraie fonctionnalité vidéo. Entièrement statique côté source :
 * pas d'îlot React nécessaire ici, aucune interaction (pas de lecteur, pas
 * de clic sur les vignettes — cf. le commentaire dans DramaCard.tsx).
 */

use App\Support\View;

$episodes = [
    ['title' => 'Cœur brisé à Yaoundé', 'author' => 'Rabiatou Peka', 'genre' => 'Romance', 'episodeCount' => 12, 'duration' => '3 min', 'gradient' => 'linear-gradient(135deg, #f59e0b, #fb7185, #eb1983)'],
    ['title' => 'L\'héritage secret', 'author' => 'Rabiatou Peka', 'genre' => 'Drame familial', 'episodeCount' => 8, 'duration' => '4 min', 'gradient' => 'linear-gradient(135deg, #8b5cf6, #818cf8, #38bdf8)'],
    ['title' => 'Double vie', 'author' => 'Auteur Rabipek', 'genre' => 'Suspense', 'episodeCount' => 15, 'duration' => '3 min', 'gradient' => 'linear-gradient(135deg, #334155, #64748b, #fbbf24)'],
    ['title' => 'Le mariage arrangé', 'author' => 'Auteur Rabipek', 'genre' => 'Romance', 'episodeCount' => 10, 'duration' => '5 min', 'gradient' => 'linear-gradient(135deg, #34d399, #2dd4bf, #22d3ee)'],
    ['title' => 'Vengeance douce', 'author' => 'Rabiatou Peka', 'genre' => 'Thriller', 'episodeCount' => 9, 'duration' => '4 min', 'gradient' => 'linear-gradient(135deg, #f43f5e, #d946ef, #a855f7)'],
    ['title' => 'La promesse oubliée', 'author' => 'Auteur Rabipek', 'genre' => 'Drame', 'episodeCount' => 6, 'duration' => '3 min', 'gradient' => 'linear-gradient(135deg, #fb923c, #fbbf24, #fde047)'],
];
?>
<section class="bg-[#100f18] px-4 py-18 text-center text-white">
  <p class="inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-amber-200 uppercase">🎬 Bientôt disponible</p>
  <h1 class="mx-auto mt-6 max-w-2xl text-[clamp(1.8rem,4vw,3rem)] font-black">RabipekDrama : vos histoires en vidéo</h1>
  <p class="mx-auto mt-6 max-w-xl leading-7 opacity-70">Vos histoires préférées prennent vie en courtes vidéos, épisode par épisode. Un format vertical, immersif, pensé pour se laisser porter entre deux pages.</p>
  <div class="mt-8 flex flex-wrap justify-center gap-3">
    <a href="/livres" class="inline-block rounded-lg bg-white px-5 py-2.5 text-sm text-[#100f18] no-underline">Découvrir le catalogue →</a>
    <a href="/inscription" class="inline-block rounded-lg border border-white/20 px-5 py-2.5 text-sm text-white no-underline">Devenir auteur</a>
  </div>
</section>

<section class="mx-auto max-w-6xl px-4 py-16">
  <div class="mx-auto max-w-xl text-center">
    <p class="text-sm font-semibold tracking-widest text-brand-pink uppercase">Un avant-goût</p>
    <h2 class="mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-bold">Des dramas en préparation</h2>
    <p class="mt-3 leading-7 opacity-65">Ces vignettes illustrent le format à venir — les vraies vidéos seront publiées par nos auteurs dès l'ouverture de RabipekDrama.</p>
  </div>

  <div class="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    <?php foreach ($episodes as $episode): ?>
      <article
        class="relative flex aspect-[9/16] flex-col justify-end overflow-hidden rounded-2xl border border-black/10 bg-cover shadow-[0_10px_30px_rgb(0_0_0/15%)] after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/80 after:via-black/10 after:via-55% after:to-black/30 dark:border-white/10"
        style="background-image: <?= View::e($episode['gradient']) ?>"
      >
        <span class="absolute top-3 left-3 z-10 rounded-full bg-black/35 px-2.5 py-1 text-[0.65rem] font-semibold text-white backdrop-blur-sm">
          <?= View::e($episode['genre']) ?>
        </span>
        <span class="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/20 text-sm text-white backdrop-blur-sm">▶</span>
        <div class="relative z-10 flex flex-col gap-0.5 p-4 text-white">
          <h3 class="m-0 text-sm leading-tight font-bold"><?= View::e($episode['title']) ?></h3>
          <p class="m-0 text-xs opacity-75">Par <?= View::e($episode['author']) ?></p>
          <p class="m-0 text-[0.68rem] opacity-60"><?= $episode['episodeCount'] ?> épisodes · <?= View::e($episode['duration']) ?>/épisode</p>
        </div>
      </article>
    <?php endforeach; ?>
  </div>
</section>

<section class="bg-[#f7f0e4] px-4 py-16 text-center dark:bg-white/[0.035]">
  <span class="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber to-brand-pink text-xl">✨</span>
  <h2 class="text-[clamp(1.3rem,3vw,1.8rem)] font-bold">Vous êtes auteur RabipekNovel ?</h2>
  <p class="mx-auto mt-4 max-w-lg leading-7 opacity-65">RabipekDrama vous permettra bientôt de transformer vos récits en courtes vidéos directement depuis votre espace auteur.</p>
</section>
