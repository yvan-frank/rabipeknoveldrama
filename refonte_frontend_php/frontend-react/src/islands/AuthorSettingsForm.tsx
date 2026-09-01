import { Mail, KeyRound, Sparkles } from 'lucide-react';
import { useRequireAuth } from '../lib/useRequireAuth';
import { glassPanel } from '../lib/authorUi';
import ChangePasswordForm from './ChangePasswordForm';

// Équivalent de src/components/dashboard/author/AuthorSettingsSection.tsx —
// la modification du profil public (nom, biographie, photo, réseaux sociaux)
// n'est pas encore disponible, seul le changement de mot de passe l'est.
export default function AuthorSettingsForm() {
  const user = useRequireAuth('/espace-auteur/parametres');
  if (user === null) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Paramètres</h1>
        <p className="mt-1.5 text-sm text-white/50">Vos informations de connexion et de profil public.</p>
      </div>

      <div className={`${glassPanel} flex max-w-2xl items-center gap-4 p-6`}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber/20 to-brand-pink/20 text-brand-amber">
          <Mail size={18} />
        </span>
        <div>
          <p className="text-[0.72rem] text-white/40">Adresse e-mail</p>
          <p className="font-semibold text-white">{user === undefined ? '…' : (user?.email ?? '—')}</p>
        </div>
      </div>

      <div className={`${glassPanel} flex max-w-2xl items-start gap-3 border-brand-amber/15 bg-brand-amber/[0.04] p-5`}>
        <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-amber" />
        <p className="text-sm text-white/60">La modification du profil public (nom, biographie, photo, réseaux sociaux) sera disponible prochainement.</p>
      </div>

      <div className={`${glassPanel} max-w-2xl p-6`}>
        <div className="mb-4 flex items-center gap-2.5">
          <KeyRound size={17} className="text-brand-amber" />
          <h2 className="text-[0.95rem] font-semibold text-white">Mot de passe</h2>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
