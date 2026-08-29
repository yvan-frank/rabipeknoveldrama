<?php
/** Équivalent de src/app/inscription/page.tsx.
 * @var string $playStoreUrl @var string|null $googleClientId
 */

use App\Support\View;

$headline = 'Créez votre compte et plongez dans des histoires africaines captivantes.';
?>
<div class="grid min-h-screen lg:grid-cols-2">
  <?php require __DIR__ . '/../partials/auth-marketing-panel.php'; ?>

  <!-- Formulaire -->
  <section class="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
    <a href="/" class="mb-8 inline-flex w-fit items-center gap-2 text-sm no-underline opacity-70 hover:opacity-100 lg:hidden">
      <img src="/images/logo.png" alt="RabipekNovel" width="28" height="26" class="h-6 w-auto">
      <span class="font-semibold">RabipekNovel</span>
    </a>

    <div class="mx-auto w-full max-w-sm">
      <h1 class="text-2xl font-bold tracking-tight">Créer un compte</h1>
      <p class="mt-1.5 text-sm opacity-60">Gratuit, en moins d'une minute.</p>

      <?php if ($googleClientId !== null): ?>
        <div class="mt-8">
          <?= View::island('GoogleAuthButton', ['clientId' => $googleClientId, 'redirectTo' => '/tableau-de-bord', 'mode' => 'register']) ?>
        </div>
        <div class="my-6 flex items-center gap-3 text-xs opacity-50">
          <span class="h-px flex-1 bg-black/10 dark:bg-white/10"></span>
          ou
          <span class="h-px flex-1 bg-black/10 dark:bg-white/10"></span>
        </div>
      <?php else: ?>
        <div class="mt-8"></div>
      <?php endif; ?>

      <?= View::island('RegisterForm', ['redirectTo' => '/tableau-de-bord']) ?>
    </div>
  </section>
</div>
