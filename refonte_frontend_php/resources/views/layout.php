<?php
/**
 * @var string $content
 * @var string $title
 * @var string|null $description méta description + og:description — page
 *      sans contenu éditorial propre (auth, tableau de bord...) : omise.
 * @var string|null $canonical URL absolue ; par défaut Env::siteUrl() + le
 *      chemin courant (sans query string) — à surcharger si le chemin seul
 *      ne suffit pas (ex. plusieurs slugs pointant vers un même contenu).
 * @var string|null $ogImage URL absolue de l'image de partage ; par défaut
 *      le logo du site.
 * @var string|null $jsonLd JSON déjà encodé (json_encode côté contrôleur),
 *      injecté tel quel dans un <script type="application/ld+json"> —
 *      utilisé par les fiches livre (schema.org Book).
 * @var bool|null $noindex
 * @var bool|null $hideChrome header/footer masqués — équivalent de
 *      isImmersiveRoute() dans refonte_rabi_frontend/src/lib/immersive-routes.ts
 *      (page de lecture, tableau-de-bord, espace-auteur, administration).
 */

use App\Config\Env;
use App\Support\View;
use App\Support\Vite;

$canonicalPath = rtrim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/') ?: '/';
$canonicalUrl = $canonical ?? (Env::siteUrl() . $canonicalPath);
$ogImageUrl = $ogImage ?? (Env::siteUrl() . '/images/logo.png');

?><!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="google-site-verification" content="QCAQcjlC3-vLee-UZmgQpA4voQsPtgakm4JTjFqWe4k" />
  <title><?= View::e($title) ?></title>
  <?php if (!empty($description)): ?>
  <meta name="description" content="<?= View::e($description) ?>">
  <?php endif; ?>
  <?php if (!empty($noindex)): ?>
  <meta name="robots" content="noindex, nofollow">
  <?php else: ?>
  <link rel="canonical" href="<?= View::e($canonicalUrl) ?>">
  <?php endif; ?>

  <meta property="og:site_name" content="RabipekNovel">
  <meta property="og:type" content="website">
  <meta property="og:title" content="<?= View::e($title) ?>">
  <?php if (!empty($description)): ?>
  <meta property="og:description" content="<?= View::e($description) ?>">
  <?php endif; ?>
  <meta property="og:url" content="<?= View::e($canonicalUrl) ?>">
  <meta property="og:image" content="<?= View::e($ogImageUrl) ?>">
  <meta name="twitter:card" content="summary_large_image">

  <?php if (!empty($jsonLd)): ?>
  <script type="application/ld+json"><?= $jsonLd ?></script>
  <?php endif; ?>

  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

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
  <!-- Racine échangée par la navigation pjax (cf. frontend-react/src/pjax.ts)
       à chaque clic sur un lien interne : header/footer inclus dedans pour
       que le hideChrome de la page cible (tableau-de-bord, admin, lecture...)
       s'applique aussi sans recharger la page. -->
  <div id="pjax-root">
    <?php if (empty($hideChrome)): ?>
    <?php require __DIR__ . '/partials/header.php'; ?>
    <?php endif; ?>
    <main><?= $content ?></main>
    <?php if (empty($hideChrome)): ?>
    <?php require __DIR__ . '/partials/footer.php'; ?>
    <?php endif; ?>
  </div>
  <?= Vite::tags() ?>
</body>
</html>
