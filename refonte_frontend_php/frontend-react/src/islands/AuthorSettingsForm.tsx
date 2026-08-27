import { useEffect, useState } from 'react';
import { getSessionUser, type SessionUser } from '../lib/apiClient';

// Équivalent de src/components/dashboard/author/AuthorSettingsSection.tsx —
// affichage seul dans la source elle-même (la modification du profil public
// n'est pas encore disponible), donc pas de formulaire à soumettre ici.
export default function AuthorSettingsForm() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    getSessionUser().then(setUser);
  }, []);

  return (
    <div className="dashboard-panel">
      <p className="dashboard-panel__description">Vos informations de connexion et de profil public.</p>
      <div className="author-settings__card">
        <span className="dashboard-panel__description">Adresse e-mail</span>
        <p className="author-settings__email">{user === undefined ? '…' : (user?.email ?? '—')}</p>
        <p className="empty">La modification du profil public (nom, biographie, photo, réseaux sociaux) sera disponible prochainement.</p>
      </div>
    </div>
  );
}
