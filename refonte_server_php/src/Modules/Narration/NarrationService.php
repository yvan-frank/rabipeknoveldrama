<?php

declare(strict_types=1);

namespace App\Modules\Narration;

use App\Lib\Database;
use App\Modules\Chapters\ChaptersService;
use App\Utils\ApiError;
use App\Utils\ChapterContentEncryption;
use App\Utils\Ownership;
use PDO;
use Throwable;

/**
 * Pilote la narration audio d'un chapitre via l'API TTS Karaoké externe
 * (Piper + WhisperX) : POST /generate côté TTS pour lancer le job, puis
 * GET /status et GET /result pollés depuis getNarration (appelée par le
 * front toutes les quelques secondes, cf. commentaire dans TtsApiClient sur
 * l'absence de worker persistant côté PHP — même contrainte qu'Epub/).
 *
 * Une seule narration par chapitre : régénérer écrase la ligne précédente
 * (ON DUPLICATE KEY UPDATE sur chapter_id), pas d'historique de versions
 * contrairement aux éditions EPUB — un chapitre édité doit pouvoir être
 * renarré sans accumuler d'anciens audios orphelins.
 */
final class NarrationService
{
    private static function db(): PDO
    {
        return Database::connection();
    }

    /** @param array<string,mixed> $actingUser */
    public static function requestNarration(int $chapterId, array $actingUser, ?string $voice, ?string $dialogueVoice, ?float $speed): array
    {
        $chapter = ChaptersService::getChapterById($chapterId);
        Ownership::assertAuthorOwnership($actingUser, $chapter['book']['authorId']);

        $plainContent = ChapterContentEncryption::decrypt($chapter['content']);
        $text = self::htmlToPlainText($plainContent);
        if ($text === '') {
            throw ApiError::badRequest('Ce chapitre est vide, impossible de générer une narration');
        }

        $response = TtsApiClient::generate($text, (string) $chapter['bookId'], (string) $chapterId, $voice, $dialogueVoice, $speed);
        $status = self::mapExternalStatus($response['status'] ?? 'pending');

        // audio_url/words_json/source_text de la ligne précédente sont
        // volontairement laissés tels quels ici (pas remis à NULL) : c'est
        // pullResult() qui les écrasera au bon moment, une fois le nouveau
        // fichier téléchargé — nécessaire pour qu'il puisse encore lire
        // l'ancienne URL locale et supprimer ce fichier devenu orphelin
        // (cf. NarrationAudioStorage::deleteIfLocal).
        $db = self::db();
        $db->prepare(
            'INSERT INTO chapter_narrations (chapter_id, status, tts_job_id, voice, dialogue_voice, speed, error_message, updated_at)
             VALUES (:chapterId, :status, :jobId, :voice, :dialogueVoice, :speed, NULL, NOW())
             ON DUPLICATE KEY UPDATE
                status = VALUES(status), tts_job_id = VALUES(tts_job_id), voice = VALUES(voice),
                dialogue_voice = VALUES(dialogue_voice), speed = VALUES(speed),
                error_message = NULL, updated_at = NOW()',
        )->execute([
            'chapterId' => $chapterId,
            'status' => $status,
            'jobId' => $response['job_id'],
            'voice' => $voice,
            'dialogueVoice' => $dialogueVoice,
            'speed' => $speed,
        ]);

        // Cache côté service TTS (même texte déjà généré) : le job revient
        // déjà "done", inutile d'attendre un premier poll pour récupérer le résultat.
        if ($status === 'done') {
            self::pullResult($chapterId, $response['job_id']);
        }

        return self::getNarration($chapterId, $actingUser);
    }

    /** @param array<string,mixed> $actingUser */
    public static function cancelNarration(int $chapterId, array $actingUser): array
    {
        $chapter = ChaptersService::getChapterById($chapterId);
        Ownership::assertAuthorOwnership($actingUser, $chapter['book']['authorId']);

        $row = self::fetchRow($chapterId);
        if ($row === null || !in_array($row['status'], ['pending', 'processing'], true) || $row['tts_job_id'] === null) {
            // Rien à annuler (aucun job, ou déjà terminé) : pas une erreur,
            // on renvoie juste l'état courant.
            return self::getNarration($chapterId, $actingUser);
        }

        try {
            TtsApiClient::cancel($row['tts_job_id']);
            self::db()->prepare("UPDATE chapter_narrations SET status = 'cancelled', updated_at = NOW() WHERE chapter_id = :chapterId")
                ->execute(['chapterId' => $chapterId]);
        } catch (NarrationJobAlreadyFinishedException) {
            // Le job vient de se terminer côté TTS entre notre lecture locale
            // et l'appel d'annulation — on rafraîchit simplement l'état réel
            // au lieu de forcer 'cancelled' sur un job déjà done/error.
        } catch (Throwable) {
            // Observé en pratique : le service TTS annule bel et bien le job
            // en interne mais sa réponse HTTP à /cancel peut elle-même être
            // en erreur (bug côté service, pas côté nous). Plutôt que de
            // remonter une fausse erreur à l'auteur, on laisse getNarration()
            // ci-dessous re-sonder le vrai statut via /status et se corriger
            // automatiquement (cancelled si l'annulation a bien eu lieu,
            // sinon l'auteur reste sur "en cours" et peut réessayer).
        }

        return self::getNarration($chapterId, $actingUser);
    }

    /** @param array<string,mixed> $actingUser */
    public static function getNarration(int $chapterId, array $actingUser): array
    {
        $chapter = ChaptersService::getChapterById($chapterId);
        Ownership::assertAuthorOwnership($actingUser, $chapter['book']['authorId']);

        $row = self::fetchRow($chapterId);
        if ($row === null) {
            return ['status' => 'none'];
        }

        // Tant que le job n'est pas terminé côté TTS, on interroge son statut
        // à chaque appel (poll relayé depuis le front) plutôt que de renvoyer
        // un état potentiellement périmé. progress/etaSeconds ne sont pas
        // persistés en base (valeurs transitoires, ré-interrogées à chaque
        // poll) : on les fait juste transiter jusqu'à la réponse de cet appel.
        $liveInfo = ['progress' => null, 'etaSeconds' => null];
        if (in_array($row['status'], ['pending', 'processing'], true) && $row['tts_job_id'] !== null) {
            $liveInfo = self::refreshFromExternal($chapterId, $row['tts_job_id']);
            $row = self::fetchRow($chapterId) ?? $row;
        }

        return self::mapRow($row, $liveInfo['progress'], $liveInfo['etaSeconds']);
    }

    // @return array{progress:?string,etaSeconds:?float} état transitoire côté
    //   TTS (ex. progress="alignement_mots", etaSeconds=42.5) tant que le job
    //   est pending/processing — absents une fois le job terminé.
    private static function refreshFromExternal(int $chapterId, string $jobId): array
    {
        $empty = ['progress' => null, 'etaSeconds' => null];

        try {
            $status = TtsApiClient::status($jobId);
        } catch (Throwable) {
            // Le service TTS peut être temporairement indisponible : on
            // laisse l'état local tel quel, le prochain poll réessaiera.
            return $empty;
        }

        $mapped = self::mapExternalStatus($status['status'] ?? 'pending');
        if ($mapped === 'done') {
            self::pullResult($chapterId, $jobId);
            return $empty;
        }
        if ($mapped === 'error') {
            self::db()->prepare(
                'UPDATE chapter_narrations SET status = :status, error_message = :error, updated_at = NOW() WHERE chapter_id = :chapterId',
            )->execute([
                'status' => 'error',
                'error' => $status['error'] ?? 'La génération audio a échoué',
                'chapterId' => $chapterId,
            ]);
            return $empty;
        }

        self::db()->prepare('UPDATE chapter_narrations SET status = :status, updated_at = NOW() WHERE chapter_id = :chapterId')
            ->execute(['status' => $mapped, 'chapterId' => $chapterId]);

        return [
            'progress' => is_string($status['progress'] ?? null) ? $status['progress'] : null,
            'etaSeconds' => is_numeric($status['eta_seconds'] ?? null) ? (float) $status['eta_seconds'] : null,
        ];
    }

    private static function pullResult(int $chapterId, string $jobId): void
    {
        try {
            $result = TtsApiClient::result($jobId);
        } catch (Throwable $e) {
            self::db()->prepare(
                'UPDATE chapter_narrations SET status = :status, error_message = :error, updated_at = NOW() WHERE chapter_id = :chapterId',
            )->execute(['status' => 'error', 'error' => $e->getMessage(), 'chapterId' => $chapterId]);
            return;
        }

        $remoteAudioUrl = $result['audio_url'] ?? null;
        $localAudioUrl = null;
        if ($remoteAudioUrl !== null) {
            try {
                $localAudioUrl = NarrationAudioStorage::persist($remoteAudioUrl, $chapterId);
            } catch (Throwable $e) {
                self::db()->prepare(
                    'UPDATE chapter_narrations SET status = :status, error_message = :error, updated_at = NOW() WHERE chapter_id = :chapterId',
                )->execute(['status' => 'error', 'error' => $e->getMessage(), 'chapterId' => $chapterId]);
                return;
            }
        }

        // Régénération : l'ancien fichier local (s'il y en avait un) devient
        // orphelin dès que la ligne pointe vers le nouveau — à supprimer
        // avant d'écraser la colonne, sinon son URL est perdue.
        $previous = self::fetchRow($chapterId);
        if ($previous !== null) {
            NarrationAudioStorage::deleteIfLocal($previous['audio_url']);
        }

        self::db()->prepare(
            'UPDATE chapter_narrations SET status = :status, audio_url = :audioUrl, source_text = :sourceText, words_json = :words, error_message = NULL, updated_at = NOW()
             WHERE chapter_id = :chapterId',
        )->execute([
            'status' => 'done',
            'audioUrl' => $localAudioUrl,
            'sourceText' => $result['text'] ?? null,
            'words' => json_encode($result['words'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'chapterId' => $chapterId,
        ]);
    }

    private static function fetchRow(int $chapterId): ?array
    {
        $stmt = self::db()->prepare('SELECT * FROM chapter_narrations WHERE chapter_id = :chapterId');
        $stmt->execute(['chapterId' => $chapterId]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    private static function mapRow(array $row, ?string $progress = null, ?float $etaSeconds = null): array
    {
        $words = null;
        if ($row['words_json'] !== null) {
            $decoded = json_decode($row['words_json'], true);
            $words = is_array($decoded) ? array_map(self::mapWord(...), $decoded) : null;
        }

        return [
            'status' => $row['status'],
            'progress' => $progress,
            'etaSeconds' => $etaSeconds,
            'voice' => $row['voice'],
            'dialogueVoice' => $row['dialogue_voice'],
            'speed' => $row['speed'] !== null ? (float) $row['speed'] : null,
            'audioUrl' => $row['audio_url'],
            'text' => $row['source_text'],
            'words' => $words,
            'errorMessage' => $row['error_message'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    // char_start/char_end (snake_case, tels que renvoyés par l'API TTS) ->
    // camelCase, cohérent avec le reste de cette API (chapterNumber, bookId...).
    /** @param array<string,mixed> $word */
    private static function mapWord(array $word): array
    {
        return [
            'word' => $word['word'],
            'start' => (float) $word['start'],
            'end' => (float) $word['end'],
            'charStart' => $word['char_start'] ?? null,
            'charEnd' => $word['char_end'] ?? null,
        ];
    }

    // JobStatus externe (pending/processing/done/error) -> même vocabulaire
    // stocké localement, en tolérant les variantes possibles côté TTS.
    private static function mapExternalStatus(string $raw): string
    {
        return match ($raw) {
            'done' => 'done',
            'error' => 'error',
            'cancelled' => 'cancelled',
            'processing' => 'processing',
            default => 'pending',
        };
    }

    // Le contenu d'un chapitre est du HTML (Tiptap) — la synthèse vocale a
    // besoin de texte brut. Une simple suppression de balises suffit : la
    // qualité de la narration ne dépend pas de la mise en forme perdue,
    // seulement des mots eux-mêmes et de leur ponctuation.
    private static function htmlToPlainText(string $html): string
    {
        $withBreaks = preg_replace('/<(p|div|br|h[1-6]|li)\b[^>]*>/i', "\n", $html) ?? $html;
        $stripped = strip_tags($withBreaks);
        $decoded = html_entity_decode($stripped, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $normalized = preg_replace('/[ \t]+/', ' ', $decoded) ?? $decoded;
        $normalized = preg_replace('/\n{2,}/', "\n", $normalized) ?? $normalized;
        return trim($normalized);
    }
}
