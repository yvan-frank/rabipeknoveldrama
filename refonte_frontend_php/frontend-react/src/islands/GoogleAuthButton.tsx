import { useEffect, useRef, useState } from 'react';
import { apiClient, extractApiErrorMessage, saveSession, type SessionUser } from '../lib/apiClient';
import { resolveAuthRedirect } from '../lib/dashboard';

interface Props {
  clientId: string;
  redirectTo: string;
  mode: 'login' | 'register';
}

interface GoogleCredentialResponse {
  credential: string;
}

// Un seul <script> Google Identity Services partagé, même si les deux pages
// (connexion + inscription) ne montent jamais cet îlot en même temps.
let gsiScriptPromise: Promise<void> | null = null;
function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  gsiScriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Échec du chargement de Google Identity Services'));
    document.head.appendChild(script);
  });
  return gsiScriptPromise;
}

// Bouton officiel Google (google.accounts.id.renderButton) plutôt qu'un
// bouton maison : le style/texte reste géré par Google (contraintes de
// branding + compatibilité FedCM), on ne fait qu'échanger le idToken produit
// contre une session via POST /auth/google — même endpoint que le mobile
// (@react-native-google-signin), qui accepte les deux audiences.
export default function GoogleAuthButton({ clientId, redirectTo, mode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function handleCredentialResponse(response: GoogleCredentialResponse) {
      setError(null);
      try {
        const res = await apiClient.post<{ data: { user: SessionUser; accessToken: string; refreshToken: string } }>(
          '/auth/google',
          { idToken: response.credential },
        );
        saveSession(res.data.data);
        window.location.href = resolveAuthRedirect(redirectTo, res.data.data.user.role);
      } catch (err) {
        setError(extractApiErrorMessage(err, 'Connexion Google impossible'));
      }
    }

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredentialResponse });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          width: 320,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError('Google Identity Services indisponible pour le moment.');
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, mode, redirectTo]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} className="flex min-h-11 items-center justify-center" />
      {!ready && !error && <div className="h-11 w-full max-w-[320px] animate-pulse rounded-full bg-black/5 dark:bg-white/10" />}
      {error && <p className="text-center text-sm text-rose-600">{error}</p>}
    </div>
  );
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}
