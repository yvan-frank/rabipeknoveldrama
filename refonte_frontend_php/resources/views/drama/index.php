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
<section class="drama-hero">
  <p class="drama-hero__eyebrow">🎬 Bientôt disponible</p>
  <h1>RabipekDrama : vos histoires en vidéo</h1>
  <p>Vos histoires préférées prennent vie en courtes vidéos, épisode par épisode. Un format vertical, immersif, pensé pour se laisser porter entre deux pages.</p>
  <div class="drama-hero__actions">
    <a href="/livres" class="btn btn--primary">Découvrir le catalogue →</a>
    <a href="/inscription" class="btn btn--ghost">Devenir auteur</a>
  </div>
</section>

<section class="drama-episodes">
  <div class="drama-episodes__intro">
    <p class="about-pillars__eyebrow">Un avant-goût</p>
    <h2>Des dramas en préparation</h2>
    <p>Ces vignettes illustrent le format à venir — les vraies vidéos seront publiées par nos auteurs dès l'ouverture de RabipekDrama.</p>
  </div>

  <div class="drama-grid">
    <?php foreach ($episodes as $episode): ?>
      <article class="drama-card" style="background-image: <?= View::e($episode['gradient']) ?>">
        <span class="drama-card__genre"><?= View::e($episode['genre']) ?></span>
        <span class="drama-card__play">▶</span>
        <div class="drama-card__info">
          <h3><?= View::e($episode['title']) ?></h3>
          <p>Par <?= View::e($episode['author']) ?></p>
          <p class="drama-card__meta"><?= $episode['episodeCount'] ?> épisodes · <?= View::e($episode['duration']) ?>/épisode</p>
        </div>
      </article>
    <?php endforeach; ?>
  </div>
</section>

<section class="drama-cta">
  <span class="drama-cta__icon">✨</span>
  <h2>Vous êtes auteur RabipekNovel ?</h2>
  <p>RabipekDrama vous permettra bientôt de transformer vos récits en courtes vidéos directement depuis votre espace auteur.</p>
</section>
