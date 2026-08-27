<?php
/**
 * @var string $content
 * @var string $title
 * @var bool|null $noindex
 * @var bool|null $hideChrome header/footer masqués — équivalent de
 *      isImmersiveRoute() dans refonte_rabi_frontend/src/lib/immersive-routes.ts
 *      (page de lecture, tableau-de-bord, espace-auteur, administration).
 */

use App\Support\Vite;

?><!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title><?= \App\Support\View::e($title) ?></title>
  <?php if (!empty($noindex)): ?>
  <meta name="robots" content="noindex, nofollow">
  <?php endif; ?>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Lora:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
  <script>
    // Applique la classe .dark sur <html> avant tout rendu, en lisant le
    // choix sauvegardé (localStorage) ou la préférence système — évite le
    // flash d'un mauvais thème au chargement (FOUC). Même script que
    // refonte_rabi_frontend/src/app/layout.tsx.
    (function () {
      try {
        var stored = localStorage.getItem('theme');
        var isDark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  </script>
</head>
<body>
  <?php if (empty($hideChrome)): ?>
  <?php require __DIR__ . '/partials/header.php'; ?>
  <?php endif; ?>
  <main><?= $content ?></main>
  <?php if (empty($hideChrome)): ?>
  <?php require __DIR__ . '/partials/footer.php'; ?>
  <?php endif; ?>
  <?= Vite::tags() ?>
</body>
</html>
