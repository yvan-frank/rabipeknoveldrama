import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthPanel } from './PasswordStrengthPanel';
import { isStrongPassword } from '../lib/auth';

interface UserAccount {
  kind: 'user';
  id: number;
  name: string | null;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
}

interface AuthorAccount {
  kind: 'author';
  id: number;
  name: string | null;
  email: string;
  isAccountVerified: boolean;
}

export type EditableAccount = UserAccount | AuthorAccount;

interface Props {
  account: EditableAccount;
  onClose: () => void;
  onSaved: (updated: EditableAccount) => void;
  // Distinct de onSaved : promouvoir change le compte de table (users ->
  // author), impossible à représenter comme une simple mise à jour du même
  // EditableAccount — l'appelant recharge la liste entière à la place.
  onPromoted?: () => void;
}

// Modale d'édition rapide (nom/email/statuts) pour un compte lecteur ou
// auteur, ouverte depuis la section "Utilisateurs" de l'admin — aucun
// équivalent dans la source Next.js (qui n'affiche ces comptes qu'en
// lecture seule), fonctionnalité ajoutée pour ce scaffold.
export function EditAccountModal({ account, onClose, onSaved, onPromoted }: Props) {
  const [name, setName] = useState(account.name ?? '');
  const [email, setEmail] = useState(account.email);
  const [isActive, setIsActive] = useState(account.kind === 'user' ? account.isActive : false);
  const [isAdmin, setIsAdmin] = useState(account.kind === 'user' ? account.isAdmin : false);
  const [isAccountVerified, setIsAccountVerified] = useState(account.kind === 'author' ? account.isAccountVerified : false);
  const [password, setPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSubmitting && !isPromoting) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSubmitting, isPromoting, onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) return setError('Le nom doit contenir au moins 2 caractères.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Adresse e-mail invalide.');
    if (password.length > 0 && !isStrongPassword(password)) return setError('Le nouveau mot de passe ne respecte pas tous les critères ci-dessous.');

    setIsSubmitting(true);
    try {
      const path = account.kind === 'user' ? `/users/${account.id}` : `/authors/${account.id}`;
      const passwordField = password.length > 0 ? { password } : {};
      const body =
        account.kind === 'user'
          ? { name: name.trim(), email: email.trim(), isActive, isAdmin, ...passwordField }
          : { name: name.trim(), email: email.trim(), isAccountVerified, ...passwordField };
      const res = await apiClient.patch(path, body);
      const updated = res.data?.data;
      onSaved(
        account.kind === 'user'
          ? { kind: 'user', id: account.id, name: updated?.name ?? name, email: updated?.email ?? email, isActive, isAdmin }
          : { kind: 'author', id: account.id, name: updated?.name ?? name, email: updated?.email ?? email, isAccountVerified },
      );
    } catch (err) {
      setError(extractApiErrorMessage(err, "Impossible d'enregistrer les modifications."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePromote() {
    if (account.kind !== 'user') return;
    setPromoteError(null);
    setIsPromoting(true);
    try {
      await apiClient.post(`/users/${account.id}/promote-to-author`);
      onPromoted?.();
    } catch (err) {
      setPromoteError(extractApiErrorMessage(err, 'Impossible de promouvoir ce compte.'));
    } finally {
      setIsPromoting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && !isPromoting && onClose()}>
      <section role="dialog" aria-modal="true" className="modal edit-account-modal">
        <p className="modal__eyebrow">{account.kind === 'user' ? 'Compte lecteur' : 'Compte auteur'}</p>
        <h2>Modifier les informations</h2>

        <form onSubmit={handleSubmit} className="edit-account-modal__form">
          <label className="book-form__field">
            Nom
            <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} />
          </label>

          <label className="book-form__field">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
          </label>

          <label className="book-form__field">
            Nouveau mot de passe
            <PasswordInput
              id="edit-account-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <span className="wizard__hint">Laisser vide pour ne pas changer le mot de passe.</span>
            <PasswordStrengthPanel password={password} visible={passwordFocused && password.length > 0} />
          </label>

          {account.kind === 'user' ? (
            <div className="edit-account-modal__toggles">
              <label className="edit-account-modal__toggle">
                <span>
                  <strong>Compte actif</strong>
                  <span>Un compte inactif ne peut pas se connecter.</span>
                </span>
                <span className={`switch${isActive ? ' is-on' : ''}`} onClick={() => !isSubmitting && setIsActive((v) => !v)}>
                  <span className="switch__thumb" />
                </span>
              </label>
              <label className="edit-account-modal__toggle">
                <span>
                  <strong>Administrateur</strong>
                  <span>Accorde l'accès complet au panneau d'administration.</span>
                </span>
                <span className={`switch${isAdmin ? ' is-on' : ''}`} onClick={() => !isSubmitting && setIsAdmin((v) => !v)}>
                  <span className="switch__thumb" />
                </span>
              </label>

              <div className="edit-account-modal__promote">
                {!promoteConfirmOpen ? (
                  <button type="button" className="btn" onClick={() => setPromoteConfirmOpen(true)} disabled={isSubmitting}>
                    Promouvoir en auteur
                  </button>
                ) : (
                  <div className="edit-account-modal__promote-confirm">
                    <p>
                      Crée un compte auteur avec le même email et mot de passe, puis désactive ce compte lecteur (réversible) —
                      sinon la connexion resterait bloquée sur l'ancien compte lecteur.
                    </p>
                    {promoteError && <p className="review-form__error">{promoteError}</p>}
                    <div className="edit-account-modal__promote-actions">
                      <button type="button" className="btn" onClick={() => setPromoteConfirmOpen(false)} disabled={isPromoting}>
                        Annuler
                      </button>
                      <button type="button" className="btn btn--primary" onClick={handlePromote} disabled={isPromoting}>
                        {isPromoting ? 'Promotion…' : 'Confirmer la promotion'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="edit-account-modal__toggles">
              <label className="edit-account-modal__toggle">
                <span>
                  <strong>Compte vérifié</strong>
                  <span>Distinct de la vérification KYC (gérée depuis l'onglet dédié).</span>
                </span>
                <span
                  className={`switch${isAccountVerified ? ' is-on' : ''}`}
                  onClick={() => !isSubmitting && setIsAccountVerified((v) => !v)}
                >
                  <span className="switch__thumb" />
                </span>
              </label>
            </div>
          )}

          {error && <p className="review-form__error">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
