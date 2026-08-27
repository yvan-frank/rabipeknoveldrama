<?php

declare(strict_types=1);

namespace App\Api;

use App\Config\Env;

/**
 * Client HTTP vers refonte_server_php (ou refonte_server) — équivalent
 * serveur de src/lib/api.ts (serverFetch) côté Next.js : utilisé par les
 * contrôleurs de pages pour pré-charger les données avant rendu (SSR).
 *
 * Les formulaires et widgets interactifs, eux, appellent l'API directement
 * depuis le navigateur via les îlots React (frontend-react/src/lib/apiClient.ts),
 * exactement comme src/lib/api-client.ts côté Next.js.
 */
final class ApiClient
{
    public function __construct(private readonly ?string $sessionToken = null)
    {
    }

    /**
     * @param array<string,mixed> $query
     * @return array<string,mixed>|null null si la ressource n'existe pas (404)
     */
    public function get(string $path, array $query = []): ?array
    {
        return $this->request('GET', $path, $query);
    }

    /**
     * @param array<string,mixed> $query
     * @return array<string,mixed>|null
     */
    private function request(string $method, string $path, array $query = []): ?array
    {
        $url = Env::apiUrl() . '/' . ltrim($path, '/');
        if ($query !== []) {
            $url .= '?' . http_build_query($query);
        }

        $headers = ['Accept: application/json'];
        if ($this->sessionToken !== null) {
            $headers[] = 'Cookie: ' . Env::cookieName() . '=' . $this->sessionToken;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
        ]);

        $raw = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $error !== '') {
            // Backend injoignable : la page doit dégrader gracieusement
            // plutôt que planter (cf. ApiUnavailableError côté Next.js).
            return null;
        }

        if ($status === 404) {
            return null;
        }

        $decoded = json_decode((string) $raw, true);
        return is_array($decoded) ? $decoded : null;
    }
}
