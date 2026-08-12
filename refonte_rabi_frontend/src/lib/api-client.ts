import axios from 'axios';
import { env } from './env';

// `localhost` et une IP LAN (ex. 192.168.1.178) sont deux "sites" différents
// pour le navigateur, même si c'est la même machine : un cookie de session
// SameSite=Lax posé sur l'un n'est jamais renvoyé sur des requêtes vers
// l'autre. Pour que la session reste valide qu'on accède au site depuis le
// PC (localhost) ou depuis un téléphone sur le LAN, l'API doit toujours être
// appelée sur le même host que la page actuelle — on ne se contente donc pas
// de la valeur figée de NEXT_PUBLIC_API_URL côté client.
function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') return env.API_URL;
  try {
    const configured = new URL(env.API_URL);
    if (configured.hostname === window.location.hostname) return env.API_URL;
    configured.hostname = window.location.hostname;
    return configured.toString().replace(/\/$/, '');
  } catch {
    return env.API_URL;
  }
}

// Instance utilisée uniquement dans les Client Components ('use client').
// `withCredentials: true` est indispensable pour que le cookie httpOnly
// posé par rabipek_server (rabipek_token) soit envoyé/reçu — le backend doit
// avoir cette origine dans CORS_ORIGINS avec `credentials: true` (déjà le cas).
export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export function extractApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return fallback;
}
