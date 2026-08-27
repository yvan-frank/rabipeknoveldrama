import { useEffect, useState } from 'react';
import { getSessionUser, type SessionUser } from '../lib/apiClient';
import { getDashboardLabel, getDashboardPath } from '../lib/dashboard';

interface Props {
  loginHref: string;
  registerHref: string;
}

// Equivalent du UserMenu dans refonte_rabi_frontend/src/components/Header.tsx :
// remplace les liens Connexion/Inscription rendus par PHP des qu'on sait si
// une session est active (GET /auth/me, cookie httpOnly deja envoye par le
// navigateur).
export default function AccountNav({ loginHref, registerHref }: Props) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSessionUser()
      .then((user) => {
        if (!cancelled) setUser(user);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[0.8rem] opacity-70">{user.email}</span>
        <a href={getDashboardPath(user.role)} className="text-sm no-underline">
          {getDashboardLabel(user.role)}
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <a href={loginHref} className="text-sm no-underline">
        Connexion
      </a>
      <a
        href={registerHref}
        className="inline-block rounded-lg bg-neutral-900 px-3.5 py-1.5 text-sm text-white no-underline dark:bg-neutral-100 dark:text-neutral-900"
      >
        Inscription
      </a>
    </div>
  );
}
