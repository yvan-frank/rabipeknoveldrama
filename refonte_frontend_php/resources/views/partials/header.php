<?php
/** Équivalent statique de src/components/Header.tsx. L'état de session
 * (utilisateur connecté, toggle thème) est géré par l'îlot React "Header"
 * monté sur ce même point, qui remplace ce markup après hydratation. */

use App\Support\View;

$navLinks = [
    '/' => 'Découvrir',
    '/livres' => 'Catalogue',
    '/rabipek-drama' => 'RabipekDrama',
    '/a-propos-de-nous' => 'À propos',
];
$currentPath = rtrim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/') ?: '/';
?>
<header class="site-header">
  <div class="site-header__inner">
    <a href="/" class="site-header__logo">
      <img src="/images/logo.png" alt="RabipekNovel" width="161" height="149">
    </a>

    <nav class="site-header__nav">
      <?php foreach ($navLinks as $href => $label): ?>
        <?php $active = $href === '/' ? $currentPath === '/' : str_starts_with($currentPath, $href); ?>
        <a href="<?= View::e($href) ?>" class="site-header__link<?= $active ? ' is-active' : '' ?>"><?= View::e($label) ?></a>
      <?php endforeach; ?>

      <?= View::island('AccountNav', ['loginHref' => '/connexion', 'registerHref' => '/inscription']) ?>
    </nav>

    <?= View::island('ThemeToggle') ?>
  </div>
</header>
