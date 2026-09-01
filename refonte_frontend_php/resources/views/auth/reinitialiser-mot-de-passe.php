<?php
/** @var string $playStoreUrl */

use App\Support\View;

$headline = 'Vos histoires africaines préférées, toujours à portée de main.';
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
      <h1 class="text-2xl font-bold tracking-tight">Choisir un nouveau mot de passe</h1>
      <p class="mt-1.5 text-sm opacity-60">Ce lien n'est valable qu'une heure après réception de l'e-mail.</p>

      <div class="mt-8">
        <?= View::island('ResetPasswordForm') ?>
      </div>
    </div>
  </section>
</div>
