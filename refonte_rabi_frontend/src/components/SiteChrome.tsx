'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileTopBar } from './MobileTopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMenuSheet } from './MobileMenuSheet';
import { ContinueReadingBanner } from './ContinueReadingBanner';
import { isImmersiveRoute } from '@/lib/immersive-routes';
import { useImmersiveOverrideStore } from '@/stores/immersive-store';

// Point central qui décide si le header/footer/nav sont affichés. Sur les
// routes immersives (lecture d'un chapitre), rien de tout ça n'est monté —
// la page de lecture gère elle-même ses propres contrôles minimalistes.
// `isForced` permet en plus à une page non-immersive par route (ex.
// l'onboarding auteur sur /inscription) de demander ponctuellement le même
// traitement (cf. useImmersiveOverrideStore).
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isForced = useImmersiveOverrideStore((state) => state.isForced);

  if (isImmersiveRoute(pathname) || isForced) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <MobileTopBar />
      <div className="h-[calc(env(safe-area-inset-top)_+_4.5rem)] sm:hidden" aria-hidden />
      <main className="flex-1">{children}</main>
      <Footer />
      <div className="h-16 sm:hidden" aria-hidden />
      <MobileBottomNav />
      <MobileMenuSheet />
      <ContinueReadingBanner />
    </>
  );
}
