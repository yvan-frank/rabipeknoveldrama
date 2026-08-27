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
<section class="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-4 p-4 text-center">
  <?php if (!empty($book['cover'])): ?>
    <img src="<?= View::e($book['cover']) ?>" alt="" class="aspect-[2/3] w-36 rounded-xl object-cover">
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

  <a href="/livres/<?= View::e($book['slug'] ?? '') ?>" class="mt-4 text-sm no-underline hover:underline">&larr; Retour à la fiche du livre</a>
</section>
