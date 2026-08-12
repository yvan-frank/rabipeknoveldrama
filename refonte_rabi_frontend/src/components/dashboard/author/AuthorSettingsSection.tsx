'use client';

import { useSession } from '@/hooks/useAuth';

export function AuthorSettingsSection() {
  const { data: user } = useSession();

  return (
    <section className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 sm:p-6 dark:border-white/8 dark:bg-white/[0.035]">
      <h2 className="text-xl font-bold">Paramètres du compte</h2>
      <p className="mt-1 text-sm text-black/45 dark:text-white/45">Vos informations de connexion et de profil public.</p>
      <div className="mt-5 rounded-2xl border border-black/8 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.035]">
        <p className="text-xs text-black/45 dark:text-white/45">Adresse e-mail</p>
        <p className="mt-1 font-medium">{user?.email}</p>
        <p className="mt-5 text-sm text-black/50 dark:text-white/50">
          La modification du profil public (nom, biographie, photo, réseaux sociaux) sera disponible prochainement.
        </p>
      </div>
    </section>
  );
}
