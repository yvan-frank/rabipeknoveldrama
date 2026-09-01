import { useEffect, useState } from 'react';
import { LayoutGrid, Library, Star, BarChart3, Wallet, ShieldCheck, Settings, Plus, X } from 'lucide-react';

export type AuthorSection = 'overview' | 'books' | 'reviews' | 'stats' | 'revenue' | 'kyc' | 'settings';

interface Props {
  active: AuthorSection;
}

const NAV_ITEMS: Array<{ id: AuthorSection; href: string; label: string; Icon: typeof LayoutGrid }> = [
  { id: 'overview', href: '/espace-auteur', label: "Vue d'ensemble", Icon: LayoutGrid },
  { id: 'books', href: '/espace-auteur/livres', label: 'Mes livres', Icon: Library },
  { id: 'reviews', href: '/espace-auteur/avis', label: 'Avis', Icon: Star },
  { id: 'stats', href: '/espace-auteur/statistiques', label: 'Statistiques', Icon: BarChart3 },
  { id: 'revenue', href: '/espace-auteur/revenus', label: 'Revenus', Icon: Wallet },
  { id: 'kyc', href: '/espace-auteur/kyc', label: 'Vérification KYC', Icon: ShieldCheck },
  { id: 'settings', href: '/espace-auteur/parametres', label: 'Paramètres', Icon: Settings },
];

// Îlot séparé de AuthorTopbar (deux racines React distinctes, cf.
// author-shell-open.php) : pas d'état React partageable entre elles, donc la
// synchronisation du tiroir mobile passe par un CustomEvent sur `window`
// plutôt que par du contexte/props — déclenché par le bouton ☰ du topbar.
export default function AuthorSidebar({ active }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleToggle() {
      setIsOpen((v) => !v);
    }
    window.addEventListener('author-nav-toggle', handleToggle);
    return () => window.removeEventListener('author-nav-toggle', handleToggle);
  }, []);

  return (
    <>
      {isOpen && (
        <div onClick={() => setIsOpen(false)} aria-hidden="true" className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" />
      )}

      <aside
        id="author-nav"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[82vw] shrink-0 flex-col gap-1 overflow-y-auto border-r border-white/10 bg-[#0b0b10]/95 p-4 backdrop-blur-2xl transition-transform duration-300 ease-out md:relative md:inset-y-auto md:z-auto md:h-full md:w-64 md:translate-x-0 md:bg-transparent md:p-5 md:transition-none ${
          isOpen ? 'translate-x-0 shadow-[0_0_60px_rgba(0,0,0,0.6)]' : '-translate-x-full'
        }`}
      >
        <div className="mb-1 flex items-center justify-between md:hidden">
          <span className="text-xs font-semibold tracking-wide text-white/40 uppercase">Menu</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer le menu"
            className="inline-flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <a
          href="/espace-auteur/livres/nouveau"
          className="mb-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-amber to-brand-pink px-4 py-3 text-sm font-semibold text-neutral-950 no-underline shadow-[0_10px_30px_-10px_rgba(245,158,11,0.65)] transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={17} strokeWidth={2.5} />
          Nouveau livre
        </a>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map(({ id, href, label, Icon }) => {
            const isActive = id === active;
            return (
              <a
                key={id}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm no-underline transition ${
                  isActive ? 'bg-white/[0.08] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90'
                }`}
              >
                <Icon size={17} strokeWidth={2} className={isActive ? 'text-brand-amber' : 'text-white/40 group-hover:text-white/70'} />
                {label}
                {isActive && <span className="ml-auto size-1.5 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink" />}
              </a>
            );
          })}
        </nav>

        <a
          href="/"
          className="mt-4 rounded-xl border border-white/5 px-3.5 py-3 text-[0.75rem] text-white/35 no-underline transition hover:border-white/10 hover:text-white/60"
        >
          ← Retour au site
        </a>
      </aside>
    </>
  );
}
