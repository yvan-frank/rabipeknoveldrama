<?php
/** Équivalent de src/app/connexion/page.tsx. @var string $redirectTo */

use App\Support\View;
?>
<section class="mx-auto max-w-lg px-4 py-12">
  <h1 class="mb-7 text-center">Connexion</h1>
  <?= View::island('LoginForm', ['redirectTo' => $redirectTo]) ?>
  <p class="mt-5 text-center text-sm opacity-70">Pas encore de compte ? <a href="/inscription" class="text-brand-amber">Inscrivez-vous</a></p>
</section>
