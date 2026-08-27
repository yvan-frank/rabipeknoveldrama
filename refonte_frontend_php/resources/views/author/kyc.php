<?php /** Équivalent de src/app/espace-auteur/kyc/page.tsx. */ ?>
<section class="mx-auto max-w-6xl p-4">
  <h1>Vérification KYC</h1>
  <?= \App\Support\View::island('KycForm', []) ?>
</section>
