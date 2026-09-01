import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { apiClient, extractApiErrorMessage, saveSession, type SessionUser } from '../lib/apiClient';
import { resolveAuthRedirect } from '../lib/dashboard';
import { PasswordInput } from '../components/PasswordInput';

interface Props {
  redirectTo: string;
}

// Équivalent de src/components/forms/LoginForm.tsx.
export default function LoginForm({ redirectTo }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  // 403 { errors: { reason: 'password_expired' } } — cf.
  // AuthService::assertPasswordNotExpired côté API : mot de passe > 180
  // jours pour un lecteur/auteur (jamais un admin), qui a déjà déclenché
  // l'envoi d'un e-mail de réinitialisation. Affichage dédié plutôt que le
  // message d'erreur générique, avec un lien de repli au cas où l'e-mail
  // n'arrive pas.
  const [isPasswordExpired, setIsPasswordExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsPasswordExpired(false);
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<{ data: { user: SessionUser; accessToken: string; refreshToken: string } }>(
        '/auth/login',
        { email, password },
      );
      saveSession(res.data.data);
      window.location.href = resolveAuthRedirect(redirectTo, res.data.data.user.role);
    } catch (err) {
      const reason = axios.isAxiosError(err) ? (err.response?.data as { errors?: { reason?: string } } | undefined)?.errors?.reason : undefined;
      if (reason === 'password_expired') {
        setIsPasswordExpired(true);
      } else {
        setError(extractApiErrorMessage(err, 'Identifiants invalides'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm opacity-85">
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-brand-amber focus:ring-3 focus:ring-brand-amber/20 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm opacity-85">
        Mot de passe
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" required />
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {isPasswordExpired && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <p>Votre mot de passe a plus de 180 jours et doit être renouvelé. Un lien de réinitialisation vient de vous être envoyé par e-mail.</p>
          <p className="mt-1.5 opacity-70">
            Rien reçu ?{' '}
            <a href="/mot-de-passe-oublie" className="font-semibold text-brand-amber no-underline hover:underline">
              Renvoyer le lien
            </a>
          </p>
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-block rounded-full bg-brand-amber px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
