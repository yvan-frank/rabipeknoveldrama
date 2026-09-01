import { useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';

// POST /auth/forgot-password renvoie toujours un succès générique (que
// l'email existe ou non, cf. AuthService::requestPasswordReset côté API) —
// ce formulaire affiche donc systématiquement le même message de
// confirmation, jamais une erreur "email introuvable" qui permettrait
// d'énumérer les comptes inscrits.
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Impossible de traiter la demande pour le moment.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-black/10 p-5 text-sm dark:border-white/10">
        <p className="font-semibold">Vérifiez votre boîte mail</p>
        <p className="mt-1.5 opacity-70">
          Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient de lui être envoyé (valide 1 heure).
        </p>
      </div>
    );
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
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-block rounded-full bg-brand-amber px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
      </button>
    </form>
  );
}
