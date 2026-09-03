<?php

declare(strict_types=1);

namespace App\Modules\Narration;

use App\Config\Env;
use App\Utils\ApiError;

/**
 * Client HTTP vers l'API TTS Karaoké externe (FastAPI, Piper + WhisperX —
 * cf. l'OpenAPI fourni par l'auteur du service). Même approche curl brute que
 * GoogleTokenVerifier plutôt qu'une dépendance Guzzle, pour rester cohérent
 * avec le reste du scaffold.
 */
final class TtsApiClient
{
    /**
     * POST /generate — lance un job de génération pour un texte brut.
     * @return array{job_id:string,status:string,cached:bool}
     */
    public static function generate(string $text, string $bookId, string $chapterId, ?string $voice, ?float $speed): array
    {
        $payload = array_filter([
            'text' => $text,
            'book_id' => $bookId,
            'chapter_id' => $chapterId,
            'voice' => $voice,
            'speed' => $speed,
        ], static fn (mixed $v): bool => $v !== null);

        return self::request('POST', '/generate', $payload);
    }

    /**
     * GET /status/{job_id}.
     * @return array{job_id:string,status:string,progress:?string,error:?string}
     */
    public static function status(string $jobId): array
    {
        return self::request('GET', '/status/' . rawurlencode($jobId));
    }

    /**
     * POST /generate/{job_id}/cancel — annulation coopérative (s'arrête au
     * prochain point de contrôle côté TTS, pas immédiatement). 409 si le job
     * est déjà terminé (done/error/cancelled) : pas une erreur pour nous,
     * l'appelant doit juste re-vérifier le statut plutôt que réessayer.
     * @return array{job_id:string,status:string,progress:?string,error:?string}
     */
    public static function cancel(string $jobId): array
    {
        return self::request('POST', '/generate/' . rawurlencode($jobId) . '/cancel');
    }

    /**
     * GET /result/{job_id}. `text` = texte source tel qu'envoyé au service
     * (mise en forme préservée) ; chaque mot porte aussi char_start/char_end,
     * sa position dans `text`, pour caler le surlignage dessus plutôt que de
     * reconstruire un texte en concaténant les mots.
     * @return array{job_id:string,status:string,audio_url:?string,text:?string,words:?list<array{word:string,start:float,end:float,char_start:?int,char_end:?int}>}
     */
    public static function result(string $jobId): array
    {
        return self::request('GET', '/result/' . rawurlencode($jobId));
    }

    /** @param array<string,mixed> $body */
    private static function request(string $method, string $path, ?array $body = null): array
    {
        $url = Env::ttsApiUrl() . $path;

        $ch = curl_init($url);
        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            // Génération (synthèse + alignement WhisperX) peut prendre du
            // temps sur un texte long : le job est async côté TTS (job_id
            // renvoyé tout de suite), mais l'appel POST /generate lui-même
            // peut rester bloqué le temps que le job soit mis en file — 20s
            // de marge, /status et /result restent des requêtes courtes.
            CURLOPT_TIMEOUT => 20,
        ];
        if ($body !== null) {
            $options[CURLOPT_HTTPHEADER] = ['Content-Type: application/json'];
            $options[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        curl_setopt_array($ch, $options);

        $raw = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $error !== '') {
            throw ApiError::internal("Service de narration audio injoignable ({$error})");
        }

        $decoded = json_decode((string) $raw, true);
        if ($status === 404) {
            throw ApiError::notFound('Job de narration introuvable côté service TTS');
        }
        // Annulation d'un job déjà terminé (done/error/cancelled) — pas une
        // vraie erreur, cf. TtsApiClient::cancel().
        if ($status === 409) {
            throw new NarrationJobAlreadyFinishedException();
        }
        if ($status >= 400 || !is_array($decoded)) {
            $detail = is_array($decoded) ? ($decoded['detail'] ?? null) : null;
            $message = is_string($detail) ? $detail : "Le service de narration a répondu une erreur ({$status})";
            throw ApiError::internal($message);
        }

        return $decoded;
    }
}
