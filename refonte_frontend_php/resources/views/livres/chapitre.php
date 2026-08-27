<?php
/**
 * Remplace l'ancienne page de lecture immersive (src/app/livres/[slug]/
 * chapitres/[numero]/page.tsx) : la lecture d'un chapitre n'est plus
 * disponible sur le web, seulement dans l'app mobile.
 *
 * @var array|null $book
 * @var string $numero
 * @var string $deepLink
 * @var string $playStoreUrl
 * @var string|null $appStoreUrl
 */

use App\Support\View;
?>
<section class="section open-in-app">
  <?php if (!empty($book['cover'])): ?>
    <img src="<?= View::e($book['cover']) ?>" alt="" class="open-in-app__cover">
  <?php endif; ?>

  <h1>Continuez la lecture dans l'app RabipekNovel</h1>
  <p>
    <?= View::e($book['title'] ?? 'Ce livre') ?> — chapitre <?= View::e($numero) ?> se lit désormais
    uniquement dans l'application mobile.
  </p>

  <?= View::island('OpenInApp', [
      'deepLink' => $deepLink,
      'playStoreUrl' => $playStoreUrl,
      'appStoreUrl' => $appStoreUrl,
  ]) ?>

  <noscript>
    <p><a href="<?= View::e($playStoreUrl) ?>">Télécharger l'app sur Google Play</a></p>
    <?php if ($appStoreUrl): ?>
      <p><a href="<?= View::e($appStoreUrl) ?>">Télécharger l'app sur l'App Store</a></p>
    <?php endif; ?>
  </noscript>

  <a href="/livres/<?= View::e($book['slug'] ?? '') ?>" class="open-in-app__back">&larr; Retour à la fiche du livre</a>
</section>
