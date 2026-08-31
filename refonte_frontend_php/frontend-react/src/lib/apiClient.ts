import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

// Equivalent de refonte_rabi_frontend/src/lib/api-client.ts : les ilots React
// appellent l'API (refonte_server_php) directement depuis le navigateur.
//
// Authentification par en-tête Authorization (comme le client mobile,
// refonte_rabi_mobile/src/api/client.ts), pas par cookie : rabipeknovel.com
// et api.rabipeknovel.com sont deux hôtes différents, et un cookie de
// session a causé des ratés de déploiement récurrents (attribut Domain à
// synchroniser sur deux .env séparés). Le jeton est stocké en localStorage
// et rattaché à chaque requête ci-dessous.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';

const ACCESS_TOKEN_KEY = 'rabipek_access_token';
const REFRESH_TOKEN_KEY = 'rabipek_refresh_token';
// Jeton invité (cf. AuthMiddleware::guestOrAuth côté serveur, header
// X-Guest-Token) : un simple JWT longue durée sans refresh token associé,
// utilisé en Bearer tant qu'aucun compte réel n'est connecté — même rôle que
// côté mobile (auth/token-storage.ts), pour garder le même visiteur invité
// d'une requête à l'autre (points/bonus) au lieu d'en recréer un à chaque appel.
const GUEST_TOKEN_KEY = 'rabipek_guest_token';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Stockage indisponible (navigation privée stricte, quota...) : la
    // session ne survivra pas à un rechargement, mais la requête en cours
    // fonctionne quand même puisque le token reste utilisable en mémoire.
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // idem
  }
}

export function getAccessToken(): string | null {
  return readStorage(ACCESS_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return readStorage(REFRESH_TOKEN_KEY);
}

function getGuestToken(): string | null {
  return readStorage(GUEST_TOKEN_KEY);
}

export function saveSession(tokens: SessionTokens): void {
  writeStorage(ACCESS_TOKEN_KEY, tokens.accessToken);
  writeStorage(REFRESH_TOKEN_KEY, tokens.refreshToken);
  // Un compte réel vient de se connecter : le jeton invité éventuel n'a
  // plus lieu d'être (AuthService::register/login réutilise déjà son userId
  // côté serveur via currentGuestUserId, cf. AuthController::currentGuestUserId).
  removeStorage(GUEST_TOKEN_KEY);
}

export function clearSession(): void {
  removeStorage(ACCESS_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
}

// Révoque le refresh token côté serveur puis nettoie le stockage local dans
// tous les cas (même si l'appel réseau échoue, on ne veut pas laisser
// l'utilisateur "coincé connecté" côté client).
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {});
  } finally {
    clearSession();
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
    return config;
  }

  // Aucun compte connecté : on retombe sur le jeton invité s'il en existe
  // déjà un, pour rester identifié comme le même visiteur d'une requête à
  // l'autre (cf. AuthMiddleware::guestOrAuth).
  const guestToken = getGuestToken();
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
    writeStorage(GUEST_TOKEN_KEY, guestToken);
  }
}

// L'access token expire après 15 min (JWT_ACCESS_EXPIRES_IN) : sur un 401,
// on tente une unique fois un rafraîchissement via le refresh token avant
// d'abandonner. `refreshPromise` évite que N requêtes en parallèle
// déclenchent N échanges de refresh token concurrents.
let refreshPromise: Promise<SessionTokens> | null = null;

async function refreshTokens(): Promise<SessionTokens> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Aucun refresh token disponible');

  const response = await axios.post<{ data: SessionTokens }>(`${API_URL}/auth/refresh`, { refreshToken });
  const tokens = response.data.data;
  saveSession(tokens);
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
    if (error.response?.status !== 401 || !config || config._retried || !getRefreshToken()) {
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
      clearSession();
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

export interface SessionUser {
  id: number;
  email: string;
  role: 'user' | 'author' | 'admin';
  // Présent uniquement pour role === 'author' — requis par POST /books
  // (BooksSchema::create exige authorId dans le corps de la requête, pas
  // déduit automatiquement de la session côté API).
  authorId?: number;
}

// GET /auth/me renvoie {success, data:{user:{...}}} — imbriqué sous "user"
// (cf. refonte_server_php AuthController::me), pas directement l'objet.
// Helper partagé pour que ce détail ne soit pas re-décodé à la main (et mal)
// dans chaque îlot qui a besoin de savoir qui est connecté. Un jeton invité
// donne aussi un objet user valide (role: 'guest') — non assignable à
// SessionUser['role'] ('user' | 'author' | 'admin') — donc on ne considère
// "connecté" qu'un access token de compte réel, jamais le jeton invité.
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!getAccessToken()) return null;
  try {
    const res = await apiClient.get('/auth/me');
    return res.data?.data?.user ?? null;
  } catch {
    return null;
  }
}
