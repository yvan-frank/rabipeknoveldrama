'use client';

import { useEffect } from 'react';
import { usePageTitleStore } from '@/stores/page-title-store';

// À placer dans une page (Server ou Client Component) dont le titre n'est
// connu qu'après un fetch — ex. le titre d'un livre. Ne rend rien : met à
// jour le store lu par <MobileTopBar />, et le réinitialise au démontage
// pour ne pas laisser un titre périmé affiché sur la page suivante.
export function SetPageTitle({ title }: { title: string }) {
  const setTitle = usePageTitleStore((state) => state.setTitle);

  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);

  return null;
}
