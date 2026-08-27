<?php
/**
 * Équivalent de src/app/tableau-de-bord/{layout,page}.tsx —
 * src/components/dashboard/UserDashboard.tsx a son propre header/sidebar
 * (pas le chrome global du site, cf. hideChrome dans DashboardController),
 * donc cette vue ne fait que monter l'îlot.
 */
?>
<?= \App\Support\View::island('Dashboard', []) ?>
