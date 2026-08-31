<?php
/**
 * Équivalent de src/app/espace-auteur/revenus/page.tsx — statique dans la
 * source elle-même (le suivi des ventes dépend du parcours d'achat en ligne,
 * pas encore disponible), donc pas d'îlot React de contenu ici. AuthGuard
 * assure quand même la garde de page côté client (cf. useRequireAuth.ts).
 */

use App\Support\View;
?>
<?= View::island('AuthGuard', ['redirect' => '/espace-auteur/revenus']) ?>
<section class="mx-auto max-w-6xl p-4">
  <h1>Revenus</h1>
  <div class="rounded-[1.25rem] border border-black/10 px-6 py-5 dark:border-white/10">
    <p class="mt-1 mb-4 text-sm opacity-60">
      Le suivi des ventes et des reversements sera ajouté à cette section une fois le parcours d'achat en ligne disponible.
    </p>
  </div>
</section>
