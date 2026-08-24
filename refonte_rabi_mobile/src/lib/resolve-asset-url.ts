import { env } from '../config/env';

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

// refonte_server enregistre certaines URLs (couvertures) en absolu à partir
// d'APP_URL au moment de l'upload. Sur un appareil physique, "localhost"
// désigne l'appareil lui-même, pas la machine de dev qui héberge l'API — on
// réécrit donc l'hôte pour qu'il corresponde à celui réellement configuré.
// Même principe que resolveApiBaseUrl côté web
// (refonte_rabi_frontend/src/lib/api-client.ts), appliqué ici à l'affichage
// plutôt qu'à l'URL de base des requêtes.
export function resolveAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (!LOCAL_HOSTS.includes(parsed.hostname)) return url;

    const apiUrl = new URL(env.API_URL);
    parsed.protocol = apiUrl.protocol;
    parsed.hostname = apiUrl.hostname;
    parsed.port = apiUrl.port;
    return parsed.toString();
  } catch {
    return url;
  }
}
