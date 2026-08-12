'use client';

import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { useSession } from '@/hooks/useAuth';
import { getDashboardLabel, getDashboardPath } from '@/lib/dashboard';
import { LEGAL_LINKS } from '@/lib/footer-links';

// Contenu et structure repris du footer historique de rabinextjs (liens
// utiles, contact, mentions légales) — adaptés aux routes qui existent
// réellement dans cette refonte (pas de lien mort vers bibliothèque/
// affiliation, pas encore construites ici).
// Masqué sur mobile : son contenu y est accessible via le panneau ouvert
// depuis la bottom nav (cf. MobileMenuSheet).
export function Footer() {
  const { data: user } = useSession();

  return (
    <footer className="hidden border-t border-black/10 sm:block dark:border-white/10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold">Rabipek</p>
          <p className="mt-3 max-w-xs text-sm text-black/60 dark:text-white/60">
            La librairie numérique qui donne de la voix aux auteurs et à leurs histoires.
          </p>
        </div>

        <div>
          <p className="font-semibold">Liens utiles</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/livres" className="text-sm text-black/60 hover:underline dark:text-white/60">
              Catalogue
            </Link>
            {user ? (
              <Link
                href={getDashboardPath(user.role)}
                className="text-sm text-black/60 hover:underline dark:text-white/60"
              >
                {getDashboardLabel(user.role)}
              </Link>
            ) : (
              <Link href="/connexion" className="text-sm text-black/60 hover:underline dark:text-white/60">
                Connexion
              </Link>
            )}
          </div>
        </div>

        <div>
          <p className="font-semibold">Contact</p>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-black/60 dark:text-white/60" />
              <div className="flex flex-col text-sm text-black/60 dark:text-white/60">
                <a href="mailto:rabipeknovel@gmail.com" className="hover:underline">
                  rabipeknovel@gmail.com
                </a>
                <a href="mailto:contact@rabipeknovel.com" className="hover:underline">
                  contact@rabipeknovel.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone size={16} className="mt-0.5 shrink-0 text-black/60 dark:text-white/60" />
              <div className="flex flex-col text-sm text-black/60 dark:text-white/60">
                <a href="tel:+237676817253" className="hover:underline">
                  +237 676 817 253
                </a>
                <a href="tel:+237690116908" className="hover:underline">
                  +237 690 116 908
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-black/50 dark:text-white/50">
            © {new Date().getFullYear()} RabipekNovel. Tous droits réservés.
          </p>
          <p className="text-xs text-black/50 dark:text-white/50">Logpom, Andem — Douala, Cameroun</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-black/60 hover:underline dark:text-white/60"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
