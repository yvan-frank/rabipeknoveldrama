import { useEffect, useState } from 'react';
import { getSessionUser, type SessionUser } from './apiClient';

// Garde de page côté client, pour les routes que AuthMiddleware::requireAuth
// (PHP) gérait avant en lisant le cookie de session au premier rendu — ce
// que PHP ne peut plus faire de façon fiable maintenant que l'authentification
// réelle passe par un jeton en localStorage (cf. apiClient.ts), invisible
// depuis le serveur au moment de la requête de navigation initiale.
//
// undefined = vérification en cours, null = redirection vers /connexion en
// cours (le composant appelant doit alors ne rien rendre), SessionUser = ok.
export function useRequireAuth(redirectTo?: string): SessionUser | null | undefined {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getSessionUser().then((u) => {
      if (!cancelled) setUser(u);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user !== null) return;
    const path = redirectTo ?? window.location.pathname;
    window.location.href = `/connexion?redirect=${encodeURIComponent(path)}`;
  }, [user, redirectTo]);

  return user;
}
