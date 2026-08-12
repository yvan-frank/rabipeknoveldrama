'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Home, User as UserIcon } from 'lucide-react';
import { useSession } from '@/hooks/useAuth';
import { getDashboardPath } from '@/lib/dashboard';

// Remplace le header sur mobile (masqué en dessous de `sm:`, voir Header.tsx) :
// barre de navigation fixe en bas d'écran façon app native, avec la zone de
// sécurité iOS (encoche/barre d'accueil) prise en compte. Le menu (footer,
// contact, légal) est ouvert depuis le bouton hamburger de MobileTopBar, pas
// d'ici — cf. MobileMenuSheet.
export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: user } = useSession();

  const accountHref = user ? getDashboardPath(user.role) : '/connexion';
  const isAccountActive = user ? pathname === accountHref : pathname === '/connexion' || pathname === '/inscription';

  const tabs = [
    { href: '/', label: 'Accueil', icon: Home, isActive: pathname === '/' },
    { href: '/livres', label: 'Catalogue', icon: BookOpenText, isActive: pathname.startsWith('/livres') },
    { href: accountHref, label: user ? 'Compte' : 'Connexion', icon: UserIcon, isActive: isAccountActive },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden dark:border-white/10">
      <div className="flex items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon, isActive }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
              isActive ? 'text-brand-amber' : 'text-black/50 dark:text-white/50'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
