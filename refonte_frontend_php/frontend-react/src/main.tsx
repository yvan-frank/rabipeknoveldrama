import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { resolveIsland } from './islands/registry';
import Placeholder from './islands/Placeholder';
import { initPjax } from './pjax';

// Racines actives, pour pouvoir les démonter proprement avant chaque
// navigation pjax (cf. unmountIslands ci-dessous).
const activeRoots = new Set<Root>();

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
    activeRoots.add(root);

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

// Démonte chaque îlot actif avant que pjax ne remplace le DOM sous leurs
// pieds (currentRoot.innerHTML = ..., cf. pjax.ts) — sans ça, React ne sait
// jamais que ces noeuds ont disparu : les effets (useEffect, listeners,
// promesses en cours) continuent de tourner sur des noeuds détachés et
// s'accumulent à chaque navigation. Concrètement, ça pouvait faire boucler
// des dizaines d'appels GET /auth/me en arrière-plan et déclencher une
// redirection vers /connexion issue d'une page précédente, alors même que la
// page actuellement affichée a une session valide.
function unmountIslands() {
  activeRoots.forEach((root) => {
    try {
      root.unmount();
    } catch {
      // Racine déjà démontée : rien à faire de plus.
    }
  });
  activeRoots.clear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountIslands);
} else {
  mountIslands();
}

// Navigation sans rechargement complet (cf. pjax.ts) : réutilise
// mountIslands pour hydrater les îlots de chaque nouvelle page échangée, et
// unmountIslands pour nettoyer ceux de la page quittée juste avant.
initPjax({ mount: mountIslands, unmount: unmountIslands });
