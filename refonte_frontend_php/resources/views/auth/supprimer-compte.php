<?php
/**
 * Chemin web de suppression de compte. L'identité du compte connecté et la
 * garde de page (redirection si non connecté) sont gérées par l'îlot
 * DeleteMyAccountButton lui-même (cf. useRequireAuth.ts) — PHP ne peut plus
 * lire le jeton de session (localStorage) au moment du rendu initial.
 */

use App\Support\View;
?>
<section class="mx-auto max-w-lg px-4 py-16 text-center">
  <h1 class="mb-3 text-2xl font-bold tracking-tight">Supprimer mon compte</h1>

  <?= View::island('DeleteMyAccountButton') ?>
</section>
