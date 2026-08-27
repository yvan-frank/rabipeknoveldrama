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
<header class="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/80">
  <input type="checkbox" id="nav-toggle" class="peer hidden">

  <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
    <a href="/" class="shrink-0">
      <img src="/images/logo.png" alt="RabipekNovel" width="161" height="149" class="h-9 w-auto sm:h-11">
    </a>

    <nav class="hidden items-center gap-6 md:flex">
      <?php foreach ($navLinks as $href => $label): ?>
        <?php $active = $href === '/' ? $currentPath === '/' : str_starts_with($currentPath, $href); ?>
        <a
          href="<?= View::e($href) ?>"
          class="text-sm no-underline <?= $active ? 'font-semibold text-brand-amber' : 'hover:text-brand-amber hover:underline' ?>"
        ><?= View::e($label) ?></a>
      <?php endforeach; ?>

      <?= View::island('AccountNav', ['loginHref' => '/connexion', 'registerHref' => '/inscription']) ?>
    </nav>

    <div class="flex items-center gap-3">
      <?= View::island('ThemeToggle') ?>
      <label
        for="nav-toggle"
        aria-label="Ouvrir le menu"
        class="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-black/10 text-lg md:hidden dark:border-white/10"
      >☰</label>
    </div>
  </div>

  <nav class="hidden flex-col gap-1 border-t border-black/10 px-4 py-4 peer-checked:flex md:hidden dark:border-white/10">
    <?php foreach ($navLinks as $href => $label): ?>
      <?php $active = $href === '/' ? $currentPath === '/' : str_starts_with($currentPath, $href); ?>
      <a
        href="<?= View::e($href) ?>"
        class="block rounded-lg px-3 py-2.5 text-sm no-underline <?= $active ? 'bg-brand-amber/10 font-semibold text-brand-amber' : 'hover:bg-black/5 dark:hover:bg-white/5' ?>"
      ><?= View::e($label) ?></a>
    <?php endforeach; ?>

    <div class="mt-2 border-t border-black/10 pt-3 dark:border-white/10">
      <?= View::island('AccountNav', ['loginHref' => '/connexion', 'registerHref' => '/inscription']) ?>
    </div>
  </nav>
</header>
