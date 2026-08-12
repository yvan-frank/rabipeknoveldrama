'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageCircle,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Settings,
  Sun,
  Wallet,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useLogout, useSession } from '@/hooks/useAuth';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import { useTheme } from '@/hooks/useTheme';
import { getDashboardPath } from '@/lib/dashboard';
import type { ApiResponse, AuthorKycStatus } from '@/types/api';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { href: '/espace-auteur', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { href: '/espace-auteur/livres', label: 'Mes livres', icon: BookOpen },
  { href: '/espace-auteur/avis', label: 'Avis lecteurs', icon: MessageCircle },
  { href: '/espace-auteur/statistiques', label: 'Statistiques', icon: LineChart },
  { href: '/espace-auteur/revenus', label: 'Revenus', icon: Wallet },
  { href: '/espace-auteur/kyc', label: 'Vérification d’identité', icon: ShieldCheck },
  { href: '/espace-auteur/parametres', label: 'Paramètres', icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === '/espace-auteur') return pathname === '/espace-auteur';
  return pathname.startsWith(href);
}

export function AuthorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { data: user, isLoading: isLoadingSession } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const kycQuery = useQuery({
    queryKey: ['author', 'kyc'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuthorKycStatus>>('/authors/moi/kyc');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: Boolean(user),
  });
  const isKycVerified = kycQuery.isSuccess && kycQuery.data.isVerified;
  const isKycPendingReview = kycQuery.isSuccess && kycQuery.data.isComplete && !kycQuery.data.isVerified;
  const needsKycAttention = kycQuery.isSuccess && !isKycVerified;

  useEffect(() => {
    if (isLoadingSession) return;
    if (!user) router.replace('/connexion');
    else if (user.role !== 'author') router.replace(getDashboardPath(user.role));
  }, [isLoadingSession, router, user]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileNavOpen]);

  if (isLoadingSession || !user || user.role !== 'author') return <div className="min-h-screen bg-background" />;

  const currentLabel = navItems.find((item) => isActive(pathname, item.href))?.label ?? 'Espace auteur';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/8 bg-background/80 px-5 backdrop-blur-xl dark:border-white/8">
        <Link href="/" className="text-xl font-black tracking-tight">
          Rabi<span className="text-amber-500 dark:text-amber-300">pek</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            className="flex size-10 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-foreground/80 dark:border-white/10 dark:bg-white/[0.04]"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-foreground/80 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-amber-300" />
          </button>
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-rose-500 text-sm font-bold text-neutral-950">
            {user.email.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-72 shrink-0 border-r border-black/8 px-4 py-7 lg:flex lg:flex-col dark:border-white/8">
          <p className="px-3 text-xs font-semibold tracking-[0.16em] text-black/35 uppercase dark:text-white/35">Espace auteur</p>
          <nav className="mt-4 flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  isActive(pathname, href)
                    ? 'bg-foreground text-background shadow-lg shadow-black/10 dark:shadow-white/10'
                    : 'text-black/60 hover:bg-black/[0.06] hover:text-foreground dark:text-white/60 dark:hover:bg-white/[0.06] dark:hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
                {href === '/espace-auteur/kyc' && needsKycAttention && <span className="ml-auto size-2 rounded-full bg-rose-500" />}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-black/55 hover:bg-rose-400/10 hover:text-rose-500 dark:text-white/55 dark:hover:text-rose-200"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-9 lg:px-10">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="mb-6 flex w-full items-center justify-between gap-2 rounded-2xl border border-black/8 bg-black/[0.02] px-4 py-3 text-sm lg:hidden dark:border-white/8 dark:bg-white/[0.035]"
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard size={16} className="text-amber-500 dark:text-amber-300" />
              {currentLabel}
            </span>
            <ChevronRight size={16} className="text-black/40 dark:text-white/40" />
          </button>

          {needsKycAttention && pathname !== '/espace-auteur/kyc' && (
            <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm sm:flex-row sm:items-center">
              <span className="flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0 text-amber-600 dark:text-amber-300" />
                {isKycPendingReview
                  ? 'Votre KYC est en attente de vérification par un administrateur.'
                  : 'Vérifiez votre identité (KYC) pour pouvoir gérer vos livres et chapitres.'}
              </span>
              {!isKycPendingReview && (
                <Link
                  href="/espace-auteur/kyc"
                  className="shrink-0 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-4 py-1.5 text-xs font-semibold text-black"
                >
                  Compléter mon KYC
                </Link>
              )}
            </div>
          )}

          <div className="flex flex-col gap-6">{children}</div>
        </main>
      </div>

      <div
        aria-hidden
        onClick={() => setIsMobileNavOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation de l'espace auteur"
        className={`fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-black/10 bg-background p-4 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] shadow-2xl transition-transform duration-300 ease-out lg:hidden dark:border-white/10 ${
          isMobileNavOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-xs font-semibold tracking-[0.16em] text-black/35 uppercase dark:text-white/35">Espace auteur</p>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Fermer"
            className="flex size-8 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsMobileNavOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                isActive(pathname, href)
                  ? 'bg-foreground text-background'
                  : 'text-black/60 hover:bg-black/[0.06] dark:text-white/60 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Icon size={18} />
              {label}
              {href === '/espace-auteur/kyc' && needsKycAttention && <span className="ml-auto size-2 rounded-full bg-rose-500" />}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-black/55 hover:bg-rose-400/10 hover:text-rose-500 dark:text-white/55 dark:hover:text-rose-200"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
      <LogoutConfirmModal open={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} isSubmitting={logout.isPending} onConfirm={() => logout.mutate(undefined, { onSuccess: () => router.replace('/connexion') })} />
    </div>
  );
}
