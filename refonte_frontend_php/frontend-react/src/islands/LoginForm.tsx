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
    <form onSubmit={handleSubmit} className="auth-form">
      <label className="book-form__field">
        Email
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="book-form__field">
        Mot de passe
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" required />
      </label>
      {error && <p className="review-form__error">{error}</p>}
      <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
