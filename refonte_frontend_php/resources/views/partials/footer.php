<?php
/** Équivalent statique de src/components/Footer.tsx (LEGAL_LINKS). */

use App\Config\Env;
use App\Support\View;

$legalLinks = [
    '/a-propos-de-nous' => 'À propos',
    '/mentions-legales' => 'Mentions légales',
    '/politique-confidentialite' => 'Politique de confidentialité',
    '/conditions-generales-de-vente' => 'Conditions générales de vente',
    '/conditions-utilisation' => "Conditions générales d'utilisation",
];
?>
<footer class="mt-12 border-t border-black/10 dark:border-white/10">
  <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-sm opacity-75">
    <p>&copy; <?= date('Y') ?> RabipekNovel</p>
    <nav class="flex flex-wrap gap-4">
      <?php foreach ($legalLinks as $href => $label): ?>
        <a href="<?= View::e($href) ?>"><?= View::e($label) ?></a>
      <?php endforeach; ?>
    </nav>
  </div>
</footer>

<?= View::island('AppDownloadBanner', [
  'playStoreUrl' => Env::playStoreUrl(),
  'appStoreUrl' => Env::appStoreUrl(),
]) ?>
