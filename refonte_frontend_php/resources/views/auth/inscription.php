<?php
/** Équivalent de src/app/inscription/page.tsx. */

use App\Support\View;
?>
<section class="section auth-page">
  <h1>Inscription</h1>
  <?= View::island('RegisterForm', ['redirectTo' => '/tableau-de-bord']) ?>
</section>
