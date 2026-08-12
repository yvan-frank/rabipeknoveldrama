'use client';

import { useEffect, useRef, useState } from 'react';

// Le header reste toujours visible tant qu'on est proche du haut de page ;
// au-delà, il se masque en scrollant vers le bas et réapparaît dès qu'on
// remonte — pattern app-like classique (Instagram, Medium...).
const REVEAL_THRESHOLD_PX = 80;

export function useHeaderVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      setIsVisible(!isScrollingDown || currentScrollY < REVEAL_THRESHOLD_PX);
      lastScrollY.current = currentScrollY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isVisible;
}
