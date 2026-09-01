import { useState, type FormEvent } from 'react';
import { apiClient, clearSession, extractApiErrorMessage } from '../lib/apiClient';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrengthPanel } from '../components/PasswordStrengthPanel';
import { isStrongPassword } from '../lib/auth';

// Formulaire générique (lecteur/auteur/admin — POST /auth/change-password
// dérive le rôle du jeton, pas de props nécessaires), monté dans les trois
// espaces "Paramètres". Un changement révoque les autres sessions actives
// côté API (cf. AuthService::changePassword) — on déconnecte donc aussi
// cette session-ci après coup, pour rester cohérent : forcer une reconnexion
// avec le nouveau mot de passe plutôt que de laisser un accessToken qui
// redeviendra invalide dès son expiration sans que rien ne l'explique.
export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isStrongPassword(password)) {
      setError('Le nouveau mot de passe ne respecte pas tous les critères ci-dessous');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, password });
      setDone(true);
      clearSession();
      setTimeout(() => {
        window.location.href = '/connexion';
      }, 2000);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Impossible de modifier le mot de passe pour le moment.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-black/10 p-5 text-sm dark:border-white/10">
        <p className="font-semibold">Mot de passe modifié</p>
        <p className="mt-1.5 opacity-70">Vous allez être redirigé vers la connexion pour vous reconnecter avec votre nouveau mot de passe.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm opacity-85">
        Mot de passe actuel
        <PasswordInput id="currentPassword" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm opacity-85">
        Nouveau mot de passe
        <PasswordInput
          id="newPassword"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />
        <PasswordStrengthPanel password={password} visible={passwordFocused} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm opacity-85">
        Confirmer le nouveau mot de passe
        <PasswordInput id="confirmNewPassword" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-block self-start rounded-full bg-brand-amber px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? 'Modification…' : 'Changer le mot de passe'}
      </button>
    </form>
  );
}
