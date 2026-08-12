'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Moon, Phone, Sun, X } from 'lucide-react';
import { useSession } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useMobileMenuStore } from '@/stores/mobile-menu-store';
import { getDashboardLabel, getDashboardPath } from '@/lib/dashboard';
import { LEGAL_LINKS } from '@/lib/footer-links';

const activeLinkClass = 'font-semibold text-brand-amber';

// Bottom sheet mobile qui reprend le contenu du footer (masqué sur mobile,
// cf. Footer.tsx) — ouvert depuis le bouton hamburger de MobileTopBar.
// Toujours monté dans le DOM (jamais démonté) : seules les classes de
// transform/opacity changent, pour permettre l'animation d'ouverture/fermeture.
export function MobileMenuSheet() {
  const { data: user } = useSession();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const open = useMobileMenuStore((state) => state.isOpen);
  const onClose = useMobileMenuStore((state) => state.close);

  // Bloque le scroll de la page derrière le panneau pendant qu'il est ouvert.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-black/10 bg-background pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)] shadow-2xl transition-transform duration-300 ease-out sm:hidden dark:border-white/10 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-brand-amber/15 via-transparent to-brand-pink/15 px-6 pt-6 pb-5">
          <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20" />
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Rabipek</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
                className="flex size-8 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer le menu"
                className="flex size-8 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <p className="mt-2 max-w-xs text-sm text-black/60 dark:text-white/60">
            La librairie numérique qui donne de la voix aux auteurs et à leurs histoires.
          </p>
        </div>

        <div className="flex flex-col gap-8 px-6 py-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-black/40 uppercase dark:text-white/40">
              Liens utiles
            </p>
            <div className="mt-3 flex flex-col divide-y divide-black/5 dark:divide-white/5">
              <Link
                href="/livres"
                onClick={onClose}
                aria-current={pathname.startsWith('/livres') ? 'page' : undefined}
                className={`py-3 text-sm ${pathname.startsWith('/livres') ? activeLinkClass : ''}`}
              >
                Catalogue
              </Link>
              <Link
                href="/rabipek-drama"
                onClick={onClose}
                aria-current={pathname.startsWith('/rabipek-drama') ? 'page' : undefined}
                className={`py-3 text-sm ${pathname.startsWith('/rabipek-drama') ? activeLinkClass : ''}`}
              >
                RabipekDrama
              </Link>
              {user ? (
                <Link
                  href={getDashboardPath(user.role)}
                  onClick={onClose}
                  aria-current={pathname.startsWith(getDashboardPath(user.role)) ? 'page' : undefined}
                  className={`py-3 text-sm ${pathname.startsWith(getDashboardPath(user.role)) ? activeLinkClass : ''}`}
                >
                  {getDashboardLabel(user.role)}
                </Link>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    onClick={onClose}
                    aria-current={pathname === '/connexion' ? 'page' : undefined}
                    className={`py-3 text-sm ${pathname === '/connexion' ? activeLinkClass : ''}`}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    onClick={onClose}
                    aria-current={pathname === '/inscription' ? 'page' : undefined}
                    className={`py-3 text-sm ${pathname === '/inscription' ? activeLinkClass : ''}`}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-black/40 uppercase dark:text-white/40">
              Contact
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <a href="mailto:rabipeknovel@gmail.com" className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-black/50 dark:text-white/50" />
                rabipeknovel@gmail.com
              </a>
              <a href="tel:+237676817253" className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-black/50 dark:text-white/50" />
                +237 676 817 253
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-black/40 uppercase dark:text-white/40">
              Légal
            </p>
            <div className="mt-3 flex flex-col divide-y divide-black/5 dark:divide-white/5">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={`py-3 text-sm ${pathname === link.href ? activeLinkClass : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-black/40 dark:text-white/40">
            © {new Date().getFullYear()} RabipekNovel. Tous droits réservés.
          </p>
        </div>
      </div>
    </>
  );
}
