<?php
/**
 * Équivalent de src/app/espace-auteur/revenus/page.tsx — statique dans la
 * source elle-même (le suivi des ventes dépend du parcours d'achat en ligne,
 * pas encore disponible), donc pas d'îlot React de contenu ici. AuthGuard
 * assure quand même la garde de page côté client (cf. useRequireAuth.ts).
 */

use App\Support\View;

require __DIR__ . '/../partials/author-shell-open.php';
?>
  <?= View::island('AuthGuard', ['redirect' => '/espace-auteur/revenus']) ?>

  <h1 class="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Revenus</h1>
  <p class="mt-1.5 text-sm text-white/50">Le détail de vos gains, versements et transactions.</p>

  <div class="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:p-12">
    <span class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber/20 to-brand-pink/20 text-2xl">💰</span>
    <p class="mx-auto mt-5 max-w-md text-sm text-white/60">
      Le suivi des ventes et des reversements sera ajouté à cette section une fois le parcours d'achat en ligne disponible.
    </p>
  </div>
<?php require __DIR__ . '/../partials/author-shell-close.php'; ?>
