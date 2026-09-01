import { useRequireAuth } from '../lib/useRequireAuth';
import ChangePasswordForm from './ChangePasswordForm';

// Équivalent de src/components/dashboard/author/AuthorSettingsSection.tsx —
// la modification du profil public (nom, biographie, photo, réseaux sociaux)
// n'est pas encore disponible, seul le changement de mot de passe l'est.
export default function AuthorSettingsForm() {
  const user = useRequireAuth('/espace-auteur/parametres');
  if (user === null) return null;

  return (
    <div className="rounded-[1.25rem] border border-black/10 px-6 py-5 dark:border-white/10">
      <p className="mt-1 mb-4 text-sm opacity-60">Vos informations de connexion et de profil public.</p>
      <div className="mt-5 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <span className="mt-1 mb-4 text-sm opacity-60">Adresse e-mail</span>
        <p className="mt-1 mb-5 font-semibold">{user === undefined ? '…' : (user?.email ?? '—')}</p>
        <p className="opacity-60">La modification du profil public (nom, biographie, photo, réseaux sociaux) sera disponible prochainement.</p>
      </div>
      <div className="mt-5 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h3 className="mb-3 text-[0.95rem]">Mot de passe</h3>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
