<?php
/**
 * Équivalent de src/app/administration/{layout,page}.tsx —
 * src/components/dashboard/AdminDashboard.tsx a son propre header/sidebar
 * (pas le chrome global du site, cf. hideChrome dans AdminController),
 * donc cette vue ne fait que monter l'îlot.
 */
?>
<?= \App\Support\View::island('AdminPanel', []) ?>
