<?php

declare(strict_types=1);

namespace App\Modules\Epub;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/epub/epub.controller.ts.
 */
final class EpubController
{
    public static function create(Request $request): void
    {
        $bookId = EpubSchema::idParam($request->params['id']);
        $edition = EpubService::requestEpubGeneration($bookId, $request->user ?? []);

        // Cf. commentaire en tête d'EpubService : génération synchrone ici,
        // faute de worker persistant côté PHP (contrat HTTP inchangé : 202
        // avec l'édition encore à l'état QUEUED tel que renvoyé ci-dessus).
        EpubService::generateEpubEdition($edition['id']);

        Response::success($edition, 202);
    }

    public static function listEditions(Request $request): void
    {
        $bookId = EpubSchema::idParam($request->params['id']);
        Response::success(EpubService::listEpubEditions($bookId, $request->user ?? []));
    }

    public static function currentEdition(Request $request): void
    {
        $bookId = EpubSchema::idParam($request->params['id']);
        Response::success(EpubService::getCurrentReadyEditionForReader($bookId));
    }

    public static function download(Request $request): void
    {
        $editionId = EpubSchema::idParam($request->params['id']);
        $file = EpubService::getEpubDownload($editionId, $request->user ?? []);

        $safeFilename = preg_replace('/[^\x20-\x7e]/', '', $file['filename']) ?? 'livre.epub';

        header('Content-Type: application/epub+zip');
        header('Content-Disposition: attachment; filename="' . $safeFilename . '"');
        header('Content-Length: ' . $file['contentLength']);
        readfile($file['path']);
        exit;
    }
}
