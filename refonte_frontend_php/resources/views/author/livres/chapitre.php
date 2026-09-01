<?php
/**
 * Page dédiée (pas une modale) de création/édition d'un chapitre —
 * équivalent immersif de ChapterForm.tsx, cf. ChapterEditorPage.tsx.
 * @var string $bookId
 * @var string|null $chapterId null = création, sinon édition de ce chapitre.
 */
require __DIR__ . '/../../partials/author-shell-open.php';
?>
  <?= \App\Support\View::island('ChapterEditorPage', $chapterId !== null ? ['bookId' => $bookId, 'chapterId' => $chapterId] : ['bookId' => $bookId]) ?>
<?php require __DIR__ . '/../../partials/author-shell-close.php'; ?>
