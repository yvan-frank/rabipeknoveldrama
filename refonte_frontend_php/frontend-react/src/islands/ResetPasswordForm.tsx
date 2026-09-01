import { useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrengthPanel } from '../components/PasswordStrengthPanel';
import { isStrongPassword } from '../lib/auth';

// Le jeton vient du lien envoyé par e-mail (?token=... — cf.
// AuthService::requestPasswordReset côté API), lu depuis l'URL plutôt que
// transmis par PHP : évite qu'il transite par le rendu serveur ou reste
// visible dans un cache de page.
function getTokenFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('token');
}

export default function ResetPasswordForm() {
  const [token] = useState(getTokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm dark:border-rose-900/40 dark:bg-rose-950/20">
        <p className="font-semibold text-rose-600">Lien invalide</p>
        <p className="mt-1.5 opacity-70">
          Ce lien de réinitialisation est incomplet. Demandez-en un nouveau depuis{' '}
          <a href="/mot-de-passe-oublie" className="font-semibold text-brand-amber no-underline hover:underline">
            cette page
          </a>
          .
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-black/10 p-5 text-sm dark:border-white/10">
        <p className="font-semibold">Mot de passe mis à jour</p>
        <p className="mt-1.5 opacity-70">
          Vous pouvez désormais vous{' '}
          <a href="/connexion" className="font-semibold text-brand-amber no-underline hover:underline">
            connecter
          </a>{' '}
          avec votre nouveau mot de passe.
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isStrongPassword(password)) {
      setError('Le mot de passe ne respecte pas tous les critères ci-dessous');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Lien de réinitialisation invalide ou expiré.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm opacity-85">
        Nouveau mot de passe
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />
        <PasswordStrengthPanel password={password} visible={passwordFocused} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm opacity-85">
        Confirmer le mot de passe
        <PasswordInput id="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-block rounded-full bg-brand-amber px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? 'Mise à jour…' : 'Réinitialiser le mot de passe'}
      </button>
    </form>
  );
}
