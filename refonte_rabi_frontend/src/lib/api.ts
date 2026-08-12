import 'server-only';
import { cookies } from 'next/headers';
import { env } from './env';
import type { ApiResponse } from '@/types/api';

interface ServerFetchOptions extends RequestInit {
  // Transmet le cookie de session au backend — nécessaire pour tout appel
  // authentifié fait depuis un Server Component/Route Handler. Par défaut
  // Next.js ne fait PAS suivre les cookies du navigateur vers `fetch()`.
  withAuth?: boolean;
}

// Backend injoignable (serveur éteint, timeout réseau), en panne (5xx), ou
// réponse illisible — l'appelant doit dégrader gracieusement (afficher un
// message), pas planter toute la page. Distinct de "la ressource n'existe
// pas" (ApiNotFoundError), qui reste une vraie 404.
export class ApiUnavailableError extends Error {
  constructor(message = "Le service est momentanément indisponible. Réessayez dans un instant.") {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

export class ApiNotFoundError extends Error {
  constructor(message = 'Ressource introuvable') {
    super(message);
    this.name = 'ApiNotFoundError';
  }
}

// Non authentifié (401) — distinct de "non autorisé malgré l'authentification"
// (ApiForbiddenError, 403). Utilisé pour le paywall de lecture : un visiteur
// anonyme sur un chapitre verrouillé doit se connecter, un lecteur connecté
// sans achat doit acheter.
export class ApiUnauthorizedError extends Error {
  constructor(message = 'Connectez-vous pour accéder à ce contenu.') {
    super(message);
    this.name = 'ApiUnauthorizedError';
  }
}

export class ApiForbiddenError extends Error {
  constructor(message = "Vous n'avez pas accès à ce contenu.") {
    super(message);
    this.name = 'ApiForbiddenError';
  }
}

// À utiliser uniquement dans des Server Components / Route Handlers
// (le `import 'server-only'` fait échouer le build si importé côté client).
// Ne configure aucune stratégie de cache par défaut : chaque appelant décide
// (`cache: 'force-cache'`, `next: { revalidate }`, etc.) selon la fraîcheur
// dont il a besoin — cf. doc Next 16 sur le caching.
export async function serverFetch<T>(path: string, options: ServerFetchOptions = {}): Promise<T> {
  const { withAuth = false, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Content-Type', 'application/json');

  if (withAuth) {
    const cookieStore = await cookies();
    requestHeaders.set('cookie', cookieStore.toString());
  }

  let res: Response;
  try {
    res = await fetch(`${env.API_URL}${path}`, { ...rest, headers: requestHeaders });
  } catch {
    // Serveur arrêté, DNS/réseau en échec, timeout... : `fetch` lui-même rejette.
    throw new ApiUnavailableError();
  }

  if (res.status >= 500) {
    throw new ApiUnavailableError();
  }

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiUnavailableError();
  }

  if (!body.success) {
    if (res.status === 404) {
      throw new ApiNotFoundError(body.message);
    }
    if (res.status === 401) {
      throw new ApiUnauthorizedError(body.message);
    }
    if (res.status === 403) {
      throw new ApiForbiddenError(body.message);
    }
    throw new Error(body.message);
  }

  return body.data;
}
