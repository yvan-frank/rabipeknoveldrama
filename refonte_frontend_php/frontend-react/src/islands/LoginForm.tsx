import { useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { PasswordInput } from '../components/PasswordInput';

interface Props {
  redirectTo: string;
}

// Équivalent de src/components/forms/LoginForm.tsx.
export default function LoginForm({ redirectTo }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/login', { email, password });
      window.location.href = redirectTo;
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Identifiants invalides'));
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
