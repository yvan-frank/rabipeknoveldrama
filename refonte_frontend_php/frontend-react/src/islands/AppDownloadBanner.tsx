import { useEffect, useRef, useState } from 'react';

interface Props {
  playStoreUrl: string;
  appStoreUrl: string | null;
}

const DISMISSED_KEY = 'rabipek-app-banner-dismissed';
// En dessous de ce seuil (px depuis le haut), on ne montre jamais le bandeau
// — évite qu'un minuscule scroll accidentel sur la page d'accueil le déclenche.
const SCROLL_THRESHOLD = 120;

// Bandeau d'invitation à installer l'app, collé en bas de l'écran : apparaît
// en scrollant vers le bas, disparaît en remontant — comportement demandé
// tel quel (inverse du pattern "barre qui se cache pour lire" habituel).
export default function AppDownloadBanner({ playStoreUrl, appStoreUrl }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === '1');
    } catch {
      // stockage indisponible (navigation privée) - le bandeau reste actif
    }
    lastScrollY.current = window.scrollY;
  }, []);

  useEffect(() => {
    if (dismissed) return;

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
  }, [dismissed]);

  function handleDismiss() {
    setDismissed(true);
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // tant pis, réapparaîtra à la prochaine visite
    }
  }

  if (dismissed) return null;

  return (
    <div
      role="complementary"
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-t-2xl border border-b-0 border-white/15 bg-gradient-to-r from-neutral-900 to-neutral-800 px-4 py-3 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.25)] sm:mb-4 sm:rounded-2xl sm:border-b">
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
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer"
          className="shrink-0 rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
