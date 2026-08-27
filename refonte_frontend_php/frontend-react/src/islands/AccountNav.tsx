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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{user.email}</span>
        <a href={getDashboardPath(user.role)} style={{ fontSize: '0.875rem' }}>
          {getDashboardLabel(user.role)}
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <a href={loginHref} style={{ fontSize: '0.875rem' }}>
        Connexion
      </a>
      <a
        href={registerHref}
        className="btn btn--primary"
        style={{ fontSize: '0.875rem', padding: '0.4rem 0.9rem' }}
      >
        Inscription
      </a>
    </div>
  );
}
