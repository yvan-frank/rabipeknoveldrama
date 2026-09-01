<?php
/**
 * Coquille commune aux 8 pages de l'espace auteur ("dark luxe" /
 * glassmorphism) — topbar + sidebar persistantes (deux îlots séparés, cf.
 * AuthorTopbar.tsx/AuthorSidebar.tsx) autour du contenu propre à chaque page.
 * Toujours en sombre, indépendamment du thème clair/sombre choisi sur le
 * reste du site : cet espace est un studio immersif à part.
 * @var string $authorActive 'overview'|'books'|'reviews'|'stats'|'revenue'|'kyc'|'settings'
 */

use App\Support\View;
?>
<div class="dark relative flex h-screen flex-col overflow-hidden bg-[#08080b] text-white">
  <!-- "dark" forcé ici (indépendamment du thème choisi sur le reste du site,
       cf. @custom-variant dark dans tailwind.css qui cible .dark en tant que
       classe, pas <html> spécifiquement) : les composants partagés
       (PasswordInput, DeleteConfirm...) utilisent des variantes dark: qui,
       sans ça, resteraient calées sur le thème clair si l'utilisateur ne l'a
       pas basculé lui-même. Ne couvre que ce qui reste descendant de ce
       conteneur : AuthorTopbar.tsx force en plus la classe sur <html> lui-même
       (useLayoutEffect), seul ancêtre commun avec les portails React
       (ChapterEditor/DeleteConfirm, sortis vers document.body). -->
  <div aria-hidden="true" class="pointer-events-none fixed inset-0 overflow-hidden">
    <div class="absolute -top-40 -left-32 size-[32rem] rounded-full bg-brand-amber/[0.08] blur-[120px]"></div>
    <div class="absolute top-1/3 -right-40 size-[36rem] rounded-full bg-brand-pink/[0.07] blur-[130px]"></div>
    <div class="absolute bottom-0 left-1/4 size-[28rem] rounded-full bg-indigo-500/[0.05] blur-[120px]"></div>
  </div>

  <?= View::island('AuthorTopbar', ['active' => $authorActive]) ?>

  <div class="relative flex flex-1 overflow-hidden">
    <?= View::island('AuthorSidebar', ['active' => $authorActive]) ?>

    <div class="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
      <div class="mx-auto w-full max-w-6xl animate-[author-fade-in_0.4s_ease-out]">
