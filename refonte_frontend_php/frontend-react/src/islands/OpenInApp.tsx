import { useEffect, useState } from 'react';

interface Props {
  deepLink: string;
  playStoreUrl: string;
  appStoreUrl: string | null;
}

// La lecture d'un chapitre n'existe plus sur le web (cf.
// BooksController::chapter côté PHP) : on tente d'ouvrir l'app via son
// deep link (scheme "rabipek://", cf. refonte_rabi_mobile/app.config.ts),
// et on affiche les liens vers les stores si rien ne se passe après un
// court délai (app pas installée, ou navigateur qui bloque le scheme).
export default function OpenInApp({ deepLink, playStoreUrl, appStoreUrl }: Props) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // On ne tente l'ouverture automatique que si le navigateur reste sur la
    // page assez longtemps pour laisser le fallback s'afficher — évite un
    // aller-retour "app store puis retour" qui masquerait les liens même
    // quand l'app n'est pas installée.
    const timer = window.setTimeout(() => setShowFallback(true), 1500);
    window.location.href = deepLink;
    return () => window.clearTimeout(timer);
  }, [deepLink]);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        className="inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
        onClick={() => (window.location.href = deepLink)}
      >
        Ouvrir dans l'app
      </button>

      {showFallback && (
        <div className="flex flex-col items-center gap-2">
          <p>L'app ne s'est pas ouverte automatiquement ?</p>
          <a
            href={playStoreUrl}
            className="inline-block rounded-lg border border-black/10 px-5 py-2.5 text-sm no-underline dark:border-white/10"
          >
            Google Play
          </a>
          {appStoreUrl && (
            <a
              href={appStoreUrl}
              className="inline-block rounded-lg border border-black/10 px-5 py-2.5 text-sm no-underline dark:border-white/10"
            >
              App Store
            </a>
          )}
        </div>
      )}
    </div>
  );
}
