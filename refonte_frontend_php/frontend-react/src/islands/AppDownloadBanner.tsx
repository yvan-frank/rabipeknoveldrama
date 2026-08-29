import { useEffect, useRef, useState } from 'react';

interface Props {
  playStoreUrl: string;
  appStoreUrl: string | null;
}

// En dessous de ce seuil (px depuis le haut), on ne montre jamais le bandeau
// — évite qu'un minuscule scroll accidentel sur la page d'accueil le déclenche.
const SCROLL_THRESHOLD = 120;

// Bandeau d'invitation à installer l'app, collé en bas de l'écran : apparaît
// en scrollant vers le bas, disparaît en remontant. Pas de bouton de
// fermeture — doit rester disponible en permanence sur les pages publiques,
// pas d'état "fermé pour toujours" à mémoriser.
export default function AppDownloadBanner({ playStoreUrl, appStoreUrl }: Props) {
  const [visible, setVisible] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    // Pas de throttle par requestAnimationFrame ici : un rAF jamais déclenché
    // (onglet en arrière-plan, navigateur qui le suspend) laisserait le
    // bandeau figé pour le reste de la session — le calcul ci-dessous est
    // trivial, un throttle n'apporte rien à ce volume d'événements scroll.
    function onScroll() {
      const y = window.scrollY;
      const goingDown = y > lastScrollY.current;
      setVisible(y >= SCROLL_THRESHOLD && goingDown);
      lastScrollY.current = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      role="complementary"
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-3 z-40 px-4 transition-transform duration-300 ease-out sm:bottom-4 ${
        visible ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]'
      }`}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-white/15 bg-gradient-to-r from-neutral-900 to-neutral-800 px-4 py-3 text-white shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <img src="/images/logo.png" alt="" className="size-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Lisez sans limites, sur mobile</p>
          <p className="truncate text-xs opacity-70">Téléchargez l'app RabipekNovel gratuitement</p>
        </div>
        <a
          href={appStoreUrl && /iphone|ipad|ipod/i.test(navigator.userAgent) ? appStoreUrl : playStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-brand-amber px-4 py-2 text-xs font-semibold text-neutral-900 no-underline transition hover:scale-[1.03]"
        >
          Installer
        </a>
      </div>
    </div>
  );
}
