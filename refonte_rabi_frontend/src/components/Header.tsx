'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useSession, useLogout } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useHeaderVisibility } from '@/hooks/useHeaderVisibility';
import { getDashboardLabel, getDashboardPath } from '@/lib/dashboard';
import type { AuthUser } from '@/types/api';
import { LogoutConfirmModal } from './ui/LogoutConfirmModal';

const NAV_LINKS = [
  { href: '/', label: 'Découvrir' },
  { href: '/livres', label: 'Catalogue' },
  { href: '/rabipek-drama', label: 'RabipekDrama' },
  { href: '/a-propos-de-nous', label: 'À propos' },
];

// Actif si égal au chemin (accueil, exact uniquement) ou si le chemin
// courant en descend (catalogue : /livres, /livres/[slug], etc.).
function isNavLinkActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
      className="flex size-8 items-center justify-center rounded-full border border-black/10 text-black/70 transition hover:border-brand-amber/40 hover:text-black dark:border-white/10 dark:text-white/70 dark:hover:text-white"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

// Le header public ne renvoie plus directement vers les espaces (auteur/admin/
// utilisateur) — ce lien vit désormais dans ce menu déroulant, déclenché par
// le "flag" d'initiales, pour garder la nav publique courte (Découvrir,
// Catalogue, À propos) tout en gardant l'accès à une clic de distance.
function UserMenu({ user }: { user: AuthUser }) {
  const logout = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = (user.email.trim().charAt(0) || '?').toUpperCase();

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Mon compte"
        aria-expanded={isOpen}
        className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-amber to-brand-pink text-sm font-bold text-neutral-950"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute top-11 right-0 flex w-56 flex-col gap-1 rounded-2xl border border-black/10 bg-background p-2 shadow-xl dark:border-white/10">
          <p className="truncate px-3 py-1.5 text-xs text-black/45 dark:text-white/45">{user.email}</p>
          <Link
            href={getDashboardPath(user.role)}
            onClick={() => setIsOpen(false)}
            className="rounded-xl px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            {getDashboardLabel(user.role)}
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsLogoutConfirmOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-400/10 dark:text-rose-300"
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      )}
      <LogoutConfirmModal open={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} isSubmitting={logout.isPending} onConfirm={() => logout.mutate(undefined, { onSuccess: () => setIsLogoutConfirmOpen(false) })} />
    </div>
  );
}

// Visible uniquement à partir de `sm:` — en dessous, la navigation passe par
// <MobileBottomNav /> (voir layout.tsx), pattern app mobile plutôt qu'un
// menu hamburger classique.
export function Header() {
  const { data: user, isLoading } = useSession();
  const isVisible = useHeaderVisibility();
  const pathname = usePathname();

  return (
    <header
      className={`sticky top-0 z-40 hidden border-b border-black/10 bg-background/80 backdrop-blur-md transition-transform duration-300 sm:block dark:border-white/10 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="RabipekNovel" width={161} height={149} className="h-11 w-auto" priority />
        </Link>

        <nav className="flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isNavLinkActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`text-sm transition ${
                  active
                    ? 'font-semibold text-brand-amber'
                    : 'text-foreground hover:text-brand-amber hover:underline'
                }`}
              >
                {label}
              </Link>
            );
          })}

          {isLoading ? null : user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/connexion" className="text-sm hover:underline">
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background"
              >
                Inscription
              </Link>
            </div>
          )}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
