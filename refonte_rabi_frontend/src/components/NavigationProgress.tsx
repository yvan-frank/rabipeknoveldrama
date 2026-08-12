'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Le routeur App n'expose pas d'événements de navigation. On démarre la barre
// au clic sur les liens internes puis on la termine dès que usePathname signale
// l'arrivée sur la nouvelle page.
export function NavigationProgress() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const isNavigatingRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    if (safetyTimerRef.current !== null) window.clearTimeout(safetyTimerRef.current);
    hideTimerRef.current = null;
    safetyTimerRef.current = null;
  }, []);

  const finishNavigation = useCallback(() => {
    if (!isNavigatingRef.current) return;

    isNavigatingRef.current = false;
    if (safetyTimerRef.current !== null) window.clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = null;
    setProgress(100);
    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
      hideTimerRef.current = null;
    }, 180);
  }, []);

  const startNavigation = useCallback(() => {
    if (isNavigatingRef.current) return;

    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
    isNavigatingRef.current = true;
    setIsVisible(true);
    setProgress(12);
    window.requestAnimationFrame(() => setProgress(78));
    safetyTimerRef.current = window.setTimeout(finishNavigation, 10_000);
  }, [finishNavigation]);

  useEffect(() => {
    finishNavigation();
  }, [finishNavigation, pathname]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download') || anchor.dataset.noProgress !== undefined) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

      startNavigation();
    };

    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('popstate', startNavigation);
    return () => {
      document.removeEventListener('click', onDocumentClick, true);
      window.removeEventListener('popstate', startNavigation);
    };
  }, [startNavigation]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 right-0 left-0 z-[200] h-1 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className="relative h-full overflow-hidden rounded-r-full bg-gradient-to-r from-brand-amber via-brand-pink to-violet-500 shadow-[0_2px_14px_rgba(236,72,153,0.55)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      >
        <span className="absolute inset-y-0 right-0 w-16 -translate-x-1/3 bg-white/65 blur-sm" />
      </div>
    </div>
  );
}
