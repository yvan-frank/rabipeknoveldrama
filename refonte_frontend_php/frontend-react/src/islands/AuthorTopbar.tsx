import { useEffect, useLayoutEffect, useState } from 'react';
import { Menu, LogOut, Sparkles } from 'lucide-react';
import { getSessionUser, logout, type SessionUser } from '../lib/apiClient';
import type { AuthorSection } from './AuthorSidebar';

interface Props {
  active: AuthorSection;
}

const TITLES: Record<AuthorSection, string> = {
  overview: "Vue d'ensemble",
  books: 'Mes livres',
  reviews: 'Avis reçus',
  stats: 'Statistiques',
  revenue: 'Revenus',
  kyc: 'Vérification KYC',
  settings: 'Paramètres',
};

// Île indépendante de AuthorSidebar (cf. son commentaire) — le bouton ☰
// émet un CustomEvent que la sidebar écoute, aucun état partagé nécessaire.
export default function AuthorTopbar({ active }: Props) {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    getSessionUser().then(setUser);
  }, []);

  // Force le thème sombre sur <html> pour toute la durée de la page auteur,
  // indépendamment du thème choisi sur le reste du site. La classe "dark"
  // posée uniquement sur le conteneur de la coquille (cf.
  // author-shell-open.php) ne suffisait pas : un élément sorti via un portail
  // React vers document.body (ex. ChapterEditor/DeleteConfirm — cf.
  // BookManageDashboard.tsx, nécessaire pour échapper au containing block
  // qu'établit backdrop-filter) n'est plus descendant de ce conteneur, donc
  // ses classes dark: ne s'appliquaient plus. <html> reste un ancêtre de
  // tout, portails compris. useLayoutEffect (pas useEffect) : bascule avant
  // la peinture du premier frame, pour éviter un flash clair→sombre.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.add('dark');
    return () => {
      if (!wasDark) root.classList.remove('dark');
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      window.location.href = '/connexion';
    }
  }

  return (
    <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0b0b10]/70 px-4 py-3.5 backdrop-blur-2xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('author-nav-toggle'))}
          aria-label="Ouvrir le menu"
          className="-ml-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white md:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-amber to-brand-pink text-neutral-950">
            <Sparkles size={16} strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.95rem] font-semibold text-white">{TITLES[active]}</p>
            <p className="hidden text-[0.7rem] text-white/35 sm:block">Studio Rabipek Auteur</p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {user && <span className="hidden max-w-44 truncate text-[0.8rem] text-white/45 md:inline">{user.email}</span>}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[0.8rem] font-medium text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">{isLoggingOut ? 'Déconnexion…' : 'Déconnexion'}</span>
        </button>
      </div>
    </header>
  );
}
