<?php
/**
 * Chemin web de suppression de compte — @var array $user (authentifié, cf.
 * AuthController::deleteAccount / AuthMiddleware::requireAuth).
 */

use App\Support\View;
?>
<section class="mx-auto max-w-lg px-4 py-16 text-center">
  <h1 class="mb-3 text-2xl font-bold tracking-tight">Supprimer mon compte</h1>
  <p class="mb-1 text-sm opacity-70">
    Connecté en tant que <strong><?= View::e($user['email'] ?? $user['userCode'] ?? '') ?></strong>.
  </p>
  <p class="mx-auto mb-8 max-w-md text-sm opacity-70">
    La suppression est définitive : votre bibliothèque, vos points et votre progression de lecture seront perdus.
    Elle prend effet immédiatement, sans période de grâce.
  </p>

  <?= View::island('DeleteMyAccountButton') ?>
</section>
