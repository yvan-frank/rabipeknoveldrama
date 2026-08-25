<?php

declare(strict_types=1);

namespace App\Modules\Epub;

use App\Lib\Database;
use App\Utils\ApiError;
use App\Utils\ChapterContentEncryption;
use App\Utils\Ownership;
use PDO;
use Throwable;

/**
 * Équivalent de src/modules/epub/epub.service.ts.
 *
 * Différence assumée par rapport à Node : là où epub.worker.ts met en file
 * la génération (setImmediate, hors du cycle requête/réponse), ce scaffold
 * PHP — un processus par requête, sans event loop ni worker persistant — la
 * lance de façon SYNCHRONE depuis le contrôleur juste après la création de
 * l'édition (cf. EpubController::create). Le contrat HTTP (202 Accepted,
 * édition renvoyée à l'état QUEUED) reste identique ; seul le moment où le
 * fichier devient réellement disponible change (immédiat ici, différé côté
 * Node). Pour un vrai traitement en arrière-plan en PHP, il faudrait un
 * worker séparé (cron + table de jobs, ou une queue) — hors scope du scaffold.
 */
final class EpubService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    /** @return array{id:int,authorId:int,title:string,resume:string,cover:string,language:?string,authorName:?string,chapters:list<array{id:int,title:string,chapterNumber:int,content:string}>} */
    private static function loadEpubSource(int $bookId): array
    {
        $db = self::db();
        $bookStmt = $db->prepare(
            'SELECT b.id_book, b.id_author, b.title, b.resume, b.cover, be.language, au.name AS author_name, au.designation AS author_designation
             FROM books b
             JOIN author au ON au.id_author = b.id_author
             LEFT JOIN books_extension be ON be.book_id = b.id_book
             WHERE b.id_book = :id',
        );
        $bookStmt->execute(['id' => $bookId]);
        $book = $bookStmt->fetch();
        if ($book === false) {
            throw ApiError::notFound('Livre introuvable');
        }

        $chaptersStmt = $db->prepare(
            'SELECT id_chapter AS id, chapter_title AS title, chapter_number AS chapterNumber, content
             FROM chapters WHERE id_book = :bookId ORDER BY chapter_number ASC',
        );
        $chaptersStmt->execute(['bookId' => $bookId]);
        $chapters = array_map(static fn (array $c): array => [
            'id' => (int) $c['id'],
            'title' => $c['title'],
            'chapterNumber' => (int) $c['chapterNumber'],
            'content' => $c['content'],
        ], $chaptersStmt->fetchAll());

        return [
            'id' => (int) $book['id_book'],
            'authorId' => (int) $book['id_author'],
            'title' => $book['title'],
            'resume' => $book['resume'],
            'cover' => $book['cover'],
            'language' => $book['language'],
            'authorName' => $book['author_name'] ?? $book['author_designation'],
            'chapters' => $chapters,
        ];
    }

    private static function sourceRevision(array $book): string
    {
        $payload = json_encode([
            'title' => $book['title'],
            'description' => $book['resume'],
            'language' => $book['language'],
            'cover' => $book['cover'],
            'chapters' => array_map(static fn (array $c): array => [
                'title' => $c['title'],
                'number' => $c['chapterNumber'],
                'content' => $c['content'],
            ], $book['chapters']),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return hash('sha256', (string) $payload);
    }

    /** @param array<string,mixed> $actingUser */
    public static function requestEpubGeneration(int $bookId, array $actingUser): array
    {
        $book = self::loadEpubSource($bookId);
        Ownership::assertAuthorOwnership($actingUser, $book['authorId']);
        if ($book['chapters'] === []) {
            throw ApiError::badRequest("Ce livre n'a aucun chapitre à convertir en EPUB");
        }

        $db = self::db();
        $latestStmt = $db->prepare('SELECT MAX(version) FROM epub_editions WHERE book_id = :bookId');
        $latestStmt->execute(['bookId' => $bookId]);
        $nextVersion = ((int) $latestStmt->fetchColumn()) + 1;

        $insert = $db->prepare(
            "INSERT INTO epub_editions (book_id, version, status, source_revision, created_at, updated_at)
             VALUES (:bookId, :version, 'QUEUED', :sourceRevision, NOW(), NOW())",
        );
        $insert->execute(['bookId' => $bookId, 'version' => $nextVersion, 'sourceRevision' => self::sourceRevision($book)]);
        $id = (int) $db->lastInsertId();

        return self::fetchEditionSummary($id);
    }

    /** @param array<string,mixed> $actingUser */
    public static function listEpubEditions(int $bookId, array $actingUser): array
    {
        $book = self::loadEpubSource($bookId);
        Ownership::assertAuthorOwnership($actingUser, $book['authorId']);
        $currentRevision = self::sourceRevision($book);

        $stmt = self::db()->prepare(
            'SELECT id, version, status, source_revision, file_size_bytes, error_message, generated_at, created_at
             FROM epub_editions WHERE book_id = :bookId ORDER BY version DESC',
        );
        $stmt->execute(['bookId' => $bookId]);

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'version' => (int) $row['version'],
            'status' => $row['status'],
            'fileSizeBytes' => $row['file_size_bytes'] !== null ? (int) $row['file_size_bytes'] : null,
            'errorMessage' => $row['error_message'],
            'generatedAt' => $row['generated_at'],
            'createdAt' => $row['created_at'],
            'isCurrent' => $row['source_revision'] === $currentRevision,
        ], $stmt->fetchAll());
    }

    // Contrepartie lecteur de listEpubEditions : pas de vérification
    // d'ownership, ne renvoie que l'édition prête et à jour. L'accès réel au
    // fichier reste vérifié séparément par getEpubDownload.
    public static function getCurrentReadyEditionForReader(int $bookId): ?array
    {
        $book = self::loadEpubSource($bookId);
        $currentRevision = self::sourceRevision($book);

        $stmt = self::db()->prepare(
            "SELECT id, version, file_size_bytes, generated_at FROM epub_editions
             WHERE book_id = :bookId AND status = 'READY' AND source_revision = :revision
             ORDER BY version DESC LIMIT 1",
        );
        $stmt->execute(['bookId' => $bookId, 'revision' => $currentRevision]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }

        return [
            'id' => (int) $row['id'],
            'version' => (int) $row['version'],
            'fileSizeBytes' => $row['file_size_bytes'] !== null ? (int) $row['file_size_bytes'] : null,
            'generatedAt' => $row['generated_at'],
        ];
    }

    public static function generateEpubEdition(int $editionId): void
    {
        $db = self::db();
        $stmt = $db->prepare('SELECT id, book_id, status FROM epub_editions WHERE id = :id');
        $stmt->execute(['id' => $editionId]);
        $edition = $stmt->fetch();
        if ($edition === false || $edition['status'] !== 'QUEUED') {
            return;
        }
        $bookId = (int) $edition['book_id'];

        $db->prepare("UPDATE epub_editions SET status = 'PROCESSING', error_message = NULL, updated_at = NOW() WHERE id = :id")
            ->execute(['id' => $editionId]);

        $buildFilePath = null;

        try {
            $book = self::loadEpubSource($bookId);
            if ($book['chapters'] === []) {
                throw new \RuntimeException('Le livre ne contient aucun chapitre');
            }
            $language = trim((string) $book['language']) !== '' ? $book['language'] : 'fr';
            $authorName = $book['authorName'] ?? 'Auteur Rabipek';

            $chapterEntries = [];
            foreach ($book['chapters'] as $index => $chapter) {
                $plainContent = ChapterContentEncryption::decrypt($chapter['content']);
                $prepared = EpubHtmlSanitizer::prepareChapter($plainContent, $chapter['chapterNumber'], $language);
                $chapterEntries[] = [
                    'id' => 'chapter-' . ($index + 1),
                    'href' => sprintf('text/chapter-%03d.xhtml', $index + 1),
                    'title' => $chapter['title'],
                    'content' => $prepared['content'],
                    'assets' => $prepared['assets'],
                ];
            }

            $cover = EpubImageFetcher::download($book['cover']);
            $coverItem = '<item id="cover-image" href="images/cover.' . $cover['extension'] . '" media-type="' . $cover['mediaType'] . '" properties="cover-image"/>';
            $manifest = implode('', array_map(static fn (array $c): string => '<item id="' . $c['id'] . '" href="' . $c['href'] . '" media-type="application/xhtml+xml"/>', $chapterEntries));
            $spine = implode('', array_map(static fn (array $c): string => '<itemref idref="' . $c['id'] . '"/>', $chapterEntries));
            $navigation = implode('', array_map(
                static fn (array $c): string => '<li><a href="' . $c['href'] . '">' . EpubHtmlSanitizer::xmlEscape($c['title']) . '</a></li>',
                $chapterEntries,
            ));
            $identifier = "urn:rabipek:book:{$bookId}:edition:{$editionId}";
            $languageXml = EpubHtmlSanitizer::xmlEscape($language);
            $modified = gmdate('Y-m-d\TH:i:s\Z');

            $opf = '<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="' . $languageXml . '">'
                . '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
                . '<dc:identifier id="book-id">' . EpubHtmlSanitizer::xmlEscape($identifier) . '</dc:identifier>'
                . '<dc:title>' . EpubHtmlSanitizer::xmlEscape($book['title']) . '</dc:title>'
                . '<dc:creator>' . EpubHtmlSanitizer::xmlEscape($authorName) . '</dc:creator>'
                . '<dc:language>' . $languageXml . '</dc:language>'
                . '<dc:description>' . EpubHtmlSanitizer::xmlEscape($book['resume']) . '</dc:description>'
                . '<meta property="dcterms:modified">' . $modified . '</meta>'
                . '</metadata>'
                . '<manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>' . $coverItem . $manifest . '</manifest>'
                . '<spine>' . $spine . '</spine></package>';

            $nav = '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="' . $languageXml . '" lang="' . $languageXml . '">'
                . '<head><meta charset="utf-8"/><title>Sommaire</title></head>'
                . '<body><nav epub:type="toc" id="toc" role="doc-toc" xmlns:epub="http://www.idpf.org/2007/ops"><h1>Sommaire</h1><ol>' . $navigation . '</ol></nav></body></html>';

            $entries = [
                ['name' => 'mimetype', 'content' => 'application/epub+zip', 'store' => true],
                ['name' => 'META-INF/container.xml', 'content' => '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'],
                ['name' => 'OEBPS/content.opf', 'content' => $opf],
                ['name' => 'OEBPS/nav.xhtml', 'content' => $nav],
            ];
            foreach ($chapterEntries as $chapter) {
                $entries[] = ['name' => 'OEBPS/' . $chapter['href'], 'content' => $chapter['content']];
            }
            foreach ($chapterEntries as $chapter) {
                foreach ($chapter['assets'] as $asset) {
                    $entries[] = ['name' => 'OEBPS/' . $asset['archivePath'], 'content' => $asset['content']];
                }
            }
            $entries[] = ['name' => 'OEBPS/images/cover.' . $cover['extension'], 'content' => $cover['content']];

            $buildFilePath = EpubArchiveBuilder::build($entries);
            EpubValidator::validate($buildFilePath);
            $fileSize = filesize($buildFilePath);
            $checksum = hash_file('sha256', $buildFilePath);

            $storageKey = "{$bookId}/edition-{$editionId}.epub";
            EpubStorage::persist($buildFilePath, $storageKey);
            $buildFilePath = null; // déplacé vers le stockage durable, plus de fichier temporaire à nettoyer

            $db->beginTransaction();
            try {
                $db->prepare('DELETE FROM epub_assets WHERE epub_edition_id = :id')->execute(['id' => $editionId]);

                $assetInsert = $db->prepare(
                    'INSERT INTO epub_assets (epub_edition_id, source_url, archive_path, media_type, checksum, created_at)
                     VALUES (:editionId, :sourceUrl, :archivePath, :mediaType, :checksum, NOW())',
                );
                $assetInsert->execute([
                    'editionId' => $editionId,
                    'sourceUrl' => $cover['sourceUrl'],
                    'archivePath' => 'images/cover.' . $cover['extension'],
                    'mediaType' => $cover['mediaType'],
                    'checksum' => hash('sha256', $cover['content']),
                ]);
                foreach ($chapterEntries as $chapter) {
                    foreach ($chapter['assets'] as $asset) {
                        $assetInsert->execute([
                            'editionId' => $editionId,
                            'sourceUrl' => $asset['sourceUrl'],
                            'archivePath' => $asset['archivePath'],
                            'mediaType' => $asset['mediaType'],
                            'checksum' => hash('sha256', $asset['content']),
                        ]);
                    }
                }

                $db->prepare(
                    "UPDATE epub_editions SET status = 'READY', storage_key = :storageKey, file_size_bytes = :fileSize,
                        checksum = :checksum, generated_at = NOW(), error_message = NULL, updated_at = NOW()
                     WHERE id = :id",
                )->execute(['storageKey' => $storageKey, 'fileSize' => $fileSize, 'checksum' => $checksum, 'id' => $editionId]);

                $db->commit();
            } catch (Throwable $e) {
                $db->rollBack();
                throw $e;
            }
        } catch (Throwable $error) {
            if ($buildFilePath !== null && is_file($buildFilePath)) {
                unlink($buildFilePath);
            }
            $message = mb_substr($error->getMessage(), 0, 4000);
            $db->prepare("UPDATE epub_editions SET status = 'FAILED', error_message = :message, updated_at = NOW() WHERE id = :id")
                ->execute(['message' => $message, 'id' => $editionId]);
        }
    }

    /** @param array<string,mixed> $viewer */
    public static function getEpubDownload(int $editionId, array $viewer): array
    {
        $db = self::db();
        $stmt = $db->prepare(
            'SELECT e.id, e.book_id, e.status, e.storage_key, b.title AS book_title, b.is_free AS book_is_free, b.id_author AS book_author_id
             FROM epub_editions e JOIN books b ON b.id_book = e.book_id WHERE e.id = :id',
        );
        $stmt->execute(['id' => $editionId]);
        $edition = $stmt->fetch();

        if ($edition === false || $edition['status'] !== 'READY' || $edition['storage_key'] === null) {
            throw ApiError::notFound('Édition EPUB indisponible');
        }

        $isOwnerOrAdmin = ($viewer['role'] ?? null) === 'admin' || (int) ($viewer['authorId'] ?? -1) === (int) $edition['book_author_id'];
        if (!$isOwnerOrAdmin && !(bool) $edition['book_is_free']) {
            $bookId = (int) $edition['book_id'];

            $purchasesStmt = $db->prepare('SELECT part_id FROM achat WHERE id_user = :userId AND id_book = :bookId');
            $purchasesStmt->execute(['userId' => $viewer['id'], 'bookId' => $bookId]);
            $purchases = $purchasesStmt->fetchAll();
            $ownsWholeBook = false;
            $ownedParts = [];
            foreach ($purchases as $purchase) {
                if ($purchase['part_id'] === null) {
                    $ownsWholeBook = true;
                } else {
                    $ownedParts[(int) $purchase['part_id']] = true;
                }
            }

            if (!$ownsWholeBook) {
                $partsStmt = $db->prepare('SELECT id_book_part FROM book_parts WHERE book_id = :bookId AND is_free = 0');
                $partsStmt->execute(['bookId' => $bookId]);
                $paidPartIds = array_map('intval', array_column($partsStmt->fetchAll(), 'id_book_part'));

                $unassignedStmt = $db->prepare('SELECT 1 FROM chapters WHERE id_book = :bookId AND part_id IS NULL LIMIT 1');
                $unassignedStmt->execute(['bookId' => $bookId]);
                $hasUnassignedChapters = $unassignedStmt->fetchColumn() !== false;

                $missingPaidPart = false;
                foreach ($paidPartIds as $partId) {
                    if (!isset($ownedParts[$partId])) {
                        $missingPaidPart = true;
                        break;
                    }
                }

                if ($hasUnassignedChapters || $missingPaidPart) {
                    throw ApiError::forbidden('Achetez le livre pour télécharger son EPUB');
                }
            }
        }

        $file = EpubStorage::open($edition['storage_key']);
        if ($file === null) {
            throw ApiError::notFound('Fichier EPUB introuvable');
        }

        return [
            'path' => $file['path'],
            'contentLength' => $file['contentLength'],
            'filename' => self::filenameForBook($edition['book_title']),
        ];
    }

    // Équivalent de resumeQueuedEpubGenerations (worker.ts) : à exécuter au
    // démarrage (script CLI, cf. README) plutôt qu'implicitement à chaque
    // requête HTTP comme le ferait un simple appel dans index.php.
    public static function resumeQueuedGenerations(): array
    {
        $db = self::db();
        $stmt = $db->query("SELECT id FROM epub_editions WHERE status IN ('QUEUED', 'PROCESSING')");
        $ids = array_map('intval', array_column($stmt->fetchAll(), 'id'));

        $db->exec("UPDATE epub_editions SET status = 'QUEUED', updated_at = NOW() WHERE status = 'PROCESSING'");

        return $ids;
    }

    private static function fetchEditionSummary(int $id): array
    {
        $stmt = self::db()->prepare('SELECT id, book_id, version, status, created_at FROM epub_editions WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return [
            'id' => (int) $row['id'],
            'bookId' => (int) $row['book_id'],
            'version' => (int) $row['version'],
            'status' => $row['status'],
            'createdAt' => $row['created_at'],
        ];
    }

    private static function filenameForBook(string $title): string
    {
        $translit = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $title);
        $base = preg_replace('/[^a-zA-Z0-9]+/', '-', $translit !== false ? $translit : $title) ?? '';
        $base = trim($base, '-');
        $base = mb_substr($base, 0, 80);
        return ($base !== '' ? $base : 'livre') . '.epub';
    }
}
