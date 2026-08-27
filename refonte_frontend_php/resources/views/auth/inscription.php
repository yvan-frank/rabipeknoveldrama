<?php
/** Équivalent de src/app/inscription/page.tsx. */

use App\Support\View;
?>
<section class="mx-auto max-w-lg px-4 py-12">
  <h1 class="mb-7 text-center">Inscription</h1>
  <?= View::island('RegisterForm', ['redirectTo' => '/tableau-de-bord']) ?>
</section>
