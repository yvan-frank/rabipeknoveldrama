'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, Menu } from 'lucide-react';
import { usePageTitleStore } from '@/stores/page-title-store';
import { useMobileMenuStore } from '@/stores/mobile-menu-store';
import { STATIC_PAGE_TITLES } from '@/lib/page-titles';

// Équivalent mobile du <Header /> (masqué en dessous de `sm:`, cf. Header.tsx) :
// barre flottante arrondie en haut d'écran, façon nav bar d'app native — flèche
// retour (absente sur l'accueil), titre de la page courante, et bouton
// hamburger qui ouvre MobileMenuSheet (footer, contact, légal).
export function MobileTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const dynamicTitle = usePageTitleStore((state) => state.title);
  const openMenu = useMobileMenuStore((state) => state.open);

  const title = dynamicTitle ?? STATIC_PAGE_TITLES[pathname] ?? 'Rabipek';
  const showBack = pathname !== '/';

  return (
    <div
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)_+_0.75rem)] z-40 sm:hidden"
    >
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-black/10 bg-background/90 px-2 shadow-lg backdrop-blur-md dark:border-white/10">
        {showBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-black/70 transition hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <span className="size-9 shrink-0" aria-hidden />
        )}

        <p className="flex-1 truncate text-center text-sm font-semibold">{title}</p>

        <button
          type="button"
          onClick={openMenu}
          aria-label="Ouvrir le menu"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-black/70 transition hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
        >
          <Menu size={20} />
        </button>
      </div>
    </div>
  );
}
