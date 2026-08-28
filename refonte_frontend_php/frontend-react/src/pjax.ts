// Navigation sans rechargement complet entre les pages PHP (rendues côté
// serveur) : au clic sur un lien interne, on récupère le HTML de la page
// cible en fetch(), on échange #pjax-root (cf. resources/views/layout.php,
// qui contient header/main/footer — donc le hideChrome de la page cible
// s'applique aussi), on met à jour <title> et l'historique, puis on
// remonte les îlots React sur le nouveau contenu. Une barre de progression
// très visible (haut de l'écran) accompagne chaque navigation.
//
// Pas de gestion des <form> (soumissions GET des filtres, etc.) : hors
// scope, ces navigations restent des rechargements classiques.

const ROOT_ID = 'pjax-root';
const BAR_ID = 'pjax-progress-bar';

type MountFn = () => void;

let mount: MountFn = () => undefined;
let activeController: AbortController | null = null;
let hideTimeoutId: number | undefined;
let growTimeoutIds: number[] = [];

function ensureBar(): HTMLDivElement {
  let bar = document.getElementById(BAR_ID) as HTMLDivElement | null;
  if (bar) return bar;

  bar = document.createElement('div');
  bar.id = BAR_ID;
  bar.style.cssText = [
    'position: fixed', 'top: 0', 'left: 0', 'height: 3px', 'width: 0%',
    'background: var(--color-brand-amber, #f59e0b)',
    'box-shadow: 0 0 8px var(--color-brand-amber, #f59e0b)',
    'z-index: 9999', 'opacity: 0', 'transition: width 0.2s ease, opacity 0.3s ease',
  ].join(';');
  document.body.appendChild(bar);
  return bar;
}

function clearGrowTimeouts(): void {
  growTimeoutIds.forEach(window.clearTimeout);
  growTimeoutIds = [];
}

// Avance par paliers tant que le fetch n'est pas résolu — imite une vraie
// barre de progression sans dépendre de Content-Length (souvent absent
// derrière un serveur PHP dev/gzip).
function startProgress(): void {
  window.clearTimeout(hideTimeoutId);
  clearGrowTimeouts();

  const bar = ensureBar();
  bar.style.transition = 'none';
  bar.style.opacity = '1';
  bar.style.width = '0%';
  void bar.offsetWidth; // force le reflow pour que le prochain changement s'anime
  bar.style.transition = 'width 0.2s ease, opacity 0.3s ease';
  bar.style.width = '25%';

  growTimeoutIds.push(window.setTimeout(() => { bar.style.width = '55%'; }, 200));
  growTimeoutIds.push(window.setTimeout(() => { bar.style.width = '75%'; }, 600));
  growTimeoutIds.push(window.setTimeout(() => { bar.style.width = '90%'; }, 1500));
}

function finishProgress(): void {
  clearGrowTimeouts();
  const bar = ensureBar();
  bar.style.width = '100%';
  hideTimeoutId = window.setTimeout(() => {
    bar.style.opacity = '0';
    hideTimeoutId = window.setTimeout(() => { bar.style.width = '0%'; }, 300);
  }, 150);
}

function isPjaxable(link: HTMLAnchorElement): boolean {
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download')) return false;
  if (link.dataset.pjax === 'false') return false;

  const href = link.getAttribute('href');
  if (!href || href.startsWith('#')) return false;
  if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;

  let url: URL;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  if (url.href === window.location.href) return false;

  return true;
}

async function navigateTo(url: string, push: boolean): Promise<void> {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  startProgress();

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Une page protégée (ex. /tableau-de-bord sans session) redirige côté
    // serveur — fetch() suit la redirection, mais l'URL affichée doit suivre
    // le contenu réellement reçu (response.url), pas l'URL cliquée à l'origine.
    const finalUrl = new URL(response.url, window.location.href);
    if (finalUrl.origin !== window.location.origin) throw new Error('Redirection hors origine');

    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const newRoot = parsed.getElementById(ROOT_ID);
    const currentRoot = document.getElementById(ROOT_ID);
    if (!newRoot || !currentRoot) throw new Error('#pjax-root introuvable dans la réponse');

    currentRoot.innerHTML = newRoot.innerHTML;
    document.title = parsed.title;
    if (push) {
      window.history.pushState({ pjax: true }, '', finalUrl.href);
    } else if (finalUrl.href !== window.location.href) {
      // Navigation popstate qui a elle-même été redirigée : corrige l'entrée
      // d'historique courante plutôt que d'en empiler une nouvelle.
      window.history.replaceState({ pjax: true }, '', finalUrl.href);
    }
    window.scrollTo(0, 0);

    mount();
    finishProgress();
  } catch (err) {
    if (controller.signal.aborted) return; // remplacée par une navigation plus récente
    // Échec réseau/parsing : repli sur un rechargement classique plutôt que
    // de laisser la page dans un état incohérent.
    window.location.href = url;
  } finally {
    if (activeController === controller) activeController = null;
  }
}

export function initPjax(mountIslands: MountFn): void {
  mount = mountIslands;

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target as HTMLElement | null;
    const link = target?.closest('a');
    if (!link || !isPjaxable(link)) return;

    event.preventDefault();
    void navigateTo(link.href, true);
  });

  window.addEventListener('popstate', () => {
    void navigateTo(window.location.href, false);
  });
}
