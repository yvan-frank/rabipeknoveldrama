<?php
/**
 * Panneau marketing partagé par les pages connexion/inscription (hideChrome).
 * @var string $headline
 * @var string $playStoreUrl
 */

use App\Support\View;

$benefits = [
    ['icon' => '📚', 'text' => 'Un catalogue de romans et drames africains qui s\'agrandit chaque semaine'],
    ['icon' => '✨', 'text' => 'Gagnez des points en lisant et débloquez des chapitres sans dépenser un centime'],
    ['icon' => '🔔', 'text' => 'Retrouvez votre bibliothèque et votre progression sur tous vos appareils'],
];
?>
<section class="relative hidden flex-col justify-between overflow-hidden px-12 py-10 text-white lg:flex" style="background: linear-gradient(155deg, #1a1310 0%, #3a1f12 45%, var(--color-brand-pink) 100%);">
  <div class="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-brand-amber/30 blur-3xl"></div>
  <div class="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-brand-pink/40 blur-3xl"></div>

  <a href="/" class="relative z-10 flex items-center gap-2 no-underline">
    <img src="/images/logo.png" alt="RabipekNovel" width="40" height="37" class="h-9 w-auto brightness-0 invert">
    <span class="text-lg font-semibold text-white">RabipekNovel</span>
  </a>

  <div class="relative z-10 max-w-md">
    <span class="inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-medium backdrop-blur-sm">Rejoignez la communauté</span>
    <h1 class="mt-5 text-4xl font-bold leading-tight tracking-tight" style="font-family: var(--font-serif)">
      <?= View::e($headline) ?>
    </h1>
    <ul class="mt-8 flex flex-col gap-4">
      <?php foreach ($benefits as $benefit): ?>
        <li class="flex items-start gap-3 text-sm text-white/90">
          <span class="text-lg leading-none"><?= $benefit['icon'] ?></span>
          <span><?= View::e($benefit['text']) ?></span>
        </li>
      <?php endforeach; ?>
    </ul>

    <a
      href="<?= View::e($playStoreUrl) ?>"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 no-underline backdrop-blur-sm transition hover:bg-white/20"
    >
      <svg viewBox="0 0 512 512" class="size-6 shrink-0" aria-hidden="true">
        <path fill="#00D2FF" d="M99.5 8.4C91 13.6 86 22.7 86 34v444c0 11.3 5 20.4 13.5 25.6l232.3-251.8Z"/>
        <path fill="#00F076" d="M99.5 503.6c6 3.7 13.6 4.1 20.6.1l197.4-113.9-85.7-92.9Z"/>
        <path fill="#FF3A44" d="M317.5 390.1l87.6-50.6c14.4-8.3 14.4-29 0-37.3l-73.6-42.5-85.7 92.9Z"/>
        <path fill="#FFBC00" d="M331.5 259.7l73.6-42.5c14.4-8.3 14.4-29 0-37.3L120.1 8.5c-7-4-14.6-3.6-20.6.1L331.5 259.7Z"/>
      </svg>
      <span class="text-left leading-tight">
        <span class="block text-[11px] text-white/70">Disponible sur</span>
        <span class="block text-sm font-semibold">Google Play</span>
      </span>
    </a>
  </div>

  <p class="relative z-10 text-xs text-white/50">&copy; <?= date('Y') ?> RabipekNovel — Livres africains en ligne</p>
</section>
