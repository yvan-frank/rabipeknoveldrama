import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { resolveIsland } from './islands/registry';
import Placeholder from './islands/Placeholder';
import { initPjax } from './pjax';

// Monte chaque <div data-island="Name" data-props="{...}"> présent sur la
// page (cf. App\Support\View::island côté PHP) — équivalent minimal d'une
// architecture "islands" : PHP fait le rendu HTML/SEO, React n'hydrate que
// les fragments interactifs (formulaires, widgets), pas la page entière.
function mountIslands() {
  const nodes = document.querySelectorAll<HTMLElement>('[data-island]');

  nodes.forEach((node) => {
    const name = node.dataset.island;
    if (!name) return;

    let props: Record<string, unknown> = {};
    if (node.dataset.props) {
      try {
        props = JSON.parse(node.dataset.props);
      } catch {
        // props invalides : on monte quand meme avec {} plutot que de casser la page
      }
    }

    const loader = resolveIsland(name);
    const root = createRoot(node);

    if (!loader) {
      root.render(createElement(Placeholder, { name, ...props }));
      return;
    }

    loader()
      .then((mod) => root.render(createElement(mod.default, props)))
      .catch((err) => {
        console.error(`[island:${name}] échec du chargement`, err);
        root.render(createElement(Placeholder, { name, ...props }));
      });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountIslands);
} else {
  mountIslands();
}

// Navigation sans rechargement complet (cf. pjax.ts) : réutilise
// mountIslands pour hydrater les îlots de chaque nouvelle page échangée.
initPjax(mountIslands);
