import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import {
  clearTokens,
  getAccessToken,
  getGuestToken,
  getRefreshToken,
  saveGuestToken,
  saveTokens,
} from '../auth/token-storage';
import type { ApiEnvelope, AuthTokens } from './types';

// Contrairement au web (cookie httpOnly, cf. refonte_rabi_frontend/src/lib/api-client.ts),
// l'app mobile ne peut pas s'appuyer sur un cookie de session : chaque requête
// porte son propre access token en Authorization: Bearer (cf. Phase 1 backend
// — refonte_server/src/middlewares/auth.middleware.ts accepte les deux).
export const apiClient = axios.create({
  baseURL: env.API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
    return config;
  }

  // Aucun compte connecté : on retombe sur le jeton invité (cf.
  // AuthMiddleware::guestOrAuth) s'il en existe déjà un, pour rester
  // identifié comme le même visiteur d'une requête à l'autre.
  const guestToken = await getGuestToken();
  if (guestToken) {
    config.headers.set('Authorization', `Bearer ${guestToken}`);
  }
  return config;
});

// Le serveur pose X-Guest-Token quand guestOrAuth vient de créer/renouveler
// un compte invité — on le persiste pour que la requête suivante s'identifie
// avec le même visiteur au lieu d'en recréer un nouveau à chaque appel.
function captureGuestToken(response: AxiosResponse): void {
  const guestToken = response.headers?.['x-guest-token'];
  if (typeof guestToken === 'string' && guestToken.length > 0) {
    saveGuestToken(guestToken).catch(() => undefined);
  }
}

// L'access token expire après 15 min (JWT_ACCESS_EXPIRES_IN) : sur un 401, on
// tente une unique fois un rafraîchissement via le refresh token avant
// d'abandonner. `refreshPromise` évite que N requêtes en parallèle déclenchent
// N échanges de refresh token concurrents (celui-ci tourne à chaque usage,
// cf. refreshAccessToken côté serveur).
let refreshPromise: Promise<AuthTokens> | null = null;
let onAuthExpired: (() => void) | null = null;

export function setOnAuthExpired(callback: () => void): void {
  onAuthExpired = callback;
}

async function refreshTokens(): Promise<AuthTokens> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('Aucun refresh token disponible');

  const response = await axios.post<ApiEnvelope<AuthTokens>>(
    `${env.API_URL}/auth/refresh`,
    { refreshToken },
  );
  const tokens = response.data.data;
  await saveTokens(tokens);
  return tokens;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

apiClient.interceptors.response.use(
  (response) => {
    captureGuestToken(response);
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      captureGuestToken(error.response);
    }

    const config = error.config as RetriableConfig | undefined;
    if (error.response?.status !== 401 || !config || config._retried) {
      throw error;
    }
    config._retried = true;

    try {
      refreshPromise ??= refreshTokens().finally(() => {
        refreshPromise = null;
      });
      const tokens = await refreshPromise;
      config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      return apiClient(config);
    } catch (refreshError) {
      await clearTokens();
      onAuthExpired?.();
      throw refreshError;
    }
  },
);

export function extractApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return fallback;
}
