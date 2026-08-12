// Partagé entre Footer.tsx (desktop) et MobileMenuSheet.tsx (mobile) pour ne
// pas dupliquer la liste des pages légales.
export const LEGAL_LINKS = [
  { href: '/a-propos-de-nous', label: 'À propos' },
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
  { href: '/conditions-generales-de-vente', label: 'Conditions générales de vente' },
] as const;
