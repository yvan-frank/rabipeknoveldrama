// La page de lecture d'un chapitre est immersive : aucun header/nav visible,
// seul le contenu (cf. SiteChrome.tsx). Un seul endroit pour la règle,
// réutilisé par SiteChrome et par la page elle-même si besoin.
const IMMERSIVE_ROUTE = /^(?:\/livres\/[^/]+\/chapitres\/[^/]+|\/tableau-de-bord|\/administration|\/espace-auteur)/;

export function isImmersiveRoute(pathname: string): boolean {
  return IMMERSIVE_ROUTE.test(pathname);
}
