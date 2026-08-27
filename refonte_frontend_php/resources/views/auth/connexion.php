<?php
/** Équivalent de src/app/connexion/page.tsx. @var string $redirectTo */

use App\Support\View;
?>
<section class="section auth-page">
  <h1>Connexion</h1>
  <?= View::island('LoginForm', ['redirectTo' => $redirectTo]) ?>
  <p>Pas encore de compte ? <a href="/inscription">Inscrivez-vous</a></p>
</section>
