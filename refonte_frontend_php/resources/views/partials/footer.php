<?php
/** Équivalent statique de src/components/Footer.tsx (LEGAL_LINKS). */

use App\Support\View;

$legalLinks = [
    '/a-propos-de-nous' => 'À propos',
    '/mentions-legales' => 'Mentions légales',
    '/politique-confidentialite' => 'Politique de confidentialité',
    '/conditions-generales-de-vente' => 'Conditions générales de vente',
];
?>
<footer class="site-footer">
  <div class="site-footer__inner">
    <p>&copy; <?= date('Y') ?> RabipekNovel</p>
    <nav class="site-footer__links">
      <?php foreach ($legalLinks as $href => $label): ?>
        <a href="<?= View::e($href) ?>"><?= View::e($label) ?></a>
      <?php endforeach; ?>
    </nav>
  </div>
</footer>
