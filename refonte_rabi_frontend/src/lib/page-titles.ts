// Titres statiques pour <MobileTopBar />, par route exacte. Les routes
// dynamiques (livre, chapitre...) renseignent leur titre via <SetPageTitle />
// à la place — cf. app/livres/[id]/page.tsx.
export const STATIC_PAGE_TITLES: Record<string, string> = {
  '/': 'Rabipek',
  '/livres': 'Catalogue',
  '/connexion': 'Connexion',
  '/inscription': 'Inscription',
  '/a-propos-de-nous': 'À propos',
  '/mentions-legales': 'Mentions légales',
  '/politique-confidentialite': 'Confidentialité',
  '/conditions-generales-de-vente': 'CGV',
  '/tableau-de-bord': 'Mon espace',
  '/espace-auteur': 'Espace auteur',
  '/administration': 'Administration',
};
