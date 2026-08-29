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
  // Suppression (soft-delete) : même chose, le compte disparaît de la liste
  // plutôt que d'être mis à jour — l'appelant recharge le tableau de bord.
  onDeleted?: () => void;
}

const fieldClass = 'flex flex-col gap-1.5 text-sm opacity-85';
const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-brand-amber focus:ring-3 focus:ring-brand-amber/20 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100';
const btnClass = 'inline-block rounded-lg px-5 py-2.5 text-sm disabled:opacity-60';
const btnPrimaryClass =
  'inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900';
const btnDangerClass =
  'inline-block rounded-lg border-none bg-gradient-to-br from-rose-500 to-red-600 px-5 py-2.5 text-sm text-white disabled:opacity-60';

function Switch({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <span
      onClick={onToggle}
      className={`relative h-6.5 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
        isOn ? 'bg-gradient-to-br from-brand-amber to-brand-pink' : 'bg-black/10 dark:bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/25%)] transition-transform ${
          isOn ? 'translate-x-4.5' : ''
        }`}
      />
    </span>
  );
}

// Modale d'édition rapide (nom/email/statuts) pour un compte lecteur ou
// auteur, ouverte depuis la section "Utilisateurs" de l'admin — aucun
// équivalent dans la source Next.js (qui n'affiche ces comptes qu'en
// lecture seule), fonctionnalité ajoutée pour ce scaffold.
export function EditAccountModal({ account, onClose, onSaved, onPromoted, onDeleted }: Props) {
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSubmitting && !isPromoting && !isDeleting) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSubmitting, isPromoting, isDeleting, onClose]);

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

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const path = account.kind === 'user' ? `/users/${account.id}` : `/authors/${account.id}`;
      await apiClient.delete(path);
      onDeleted?.();
    } catch (err) {
      setDeleteError(extractApiErrorMessage(err, 'Impossible de supprimer ce compte.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && !isPromoting && !isDeleting && onClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
    >
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[30rem] rounded-[1.25rem] bg-white p-6 text-neutral-900 shadow-[0_20px_60px_rgb(0_0_0/30%)] dark:bg-neutral-900 dark:text-neutral-100"
      >
        <p className="m-0 text-[0.7rem] font-bold tracking-[0.1em] text-brand-amber uppercase">
          {account.kind === 'user' ? 'Compte lecteur' : 'Compte auteur'}
        </p>
        <h2 className="my-2 text-[1.4rem]">Modifier les informations</h2>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4.5">
          <label className={fieldClass}>
            Nom
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className={inputClass}
            />
          </label>

          <label className={fieldClass}>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} className={inputClass} />
          </label>

          <label className={fieldClass}>
            Nouveau mot de passe
            <PasswordInput
              id="edit-account-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <span className="text-xs opacity-55">Laisser vide pour ne pas changer le mot de passe.</span>
            <PasswordStrengthPanel password={password} visible={passwordFocused && password.length > 0} />
          </label>

          {account.kind === 'user' ? (
            <div className="flex flex-col gap-3 border-t border-black/10 pt-1 dark:border-white/10">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 px-4 py-3.5 dark:border-white/10">
                <span className="flex flex-col gap-0.5">
                  <strong className="text-[0.85rem]">Compte actif</strong>
                  <span className="text-xs leading-snug opacity-55">Un compte inactif ne peut pas se connecter.</span>
                </span>
                <Switch isOn={isActive} onToggle={() => !isSubmitting && setIsActive((v) => !v)} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 px-4 py-3.5 dark:border-white/10">
                <span className="flex flex-col gap-0.5">
                  <strong className="text-[0.85rem]">Administrateur</strong>
                  <span className="text-xs leading-snug opacity-55">Accorde l'accès complet au panneau d'administration.</span>
                </span>
                <Switch isOn={isAdmin} onToggle={() => !isSubmitting && setIsAdmin((v) => !v)} />
              </label>

              <div className="pt-2">
                {!promoteConfirmOpen ? (
                  <button type="button" onClick={() => setPromoteConfirmOpen(true)} disabled={isSubmitting} className={btnClass}>
                    Promouvoir en auteur
                  </button>
                ) : (
                  <div className="rounded-xl border border-black/10 px-4 py-3.5 text-[0.8rem] dark:border-white/10">
                    <p className="m-0 mb-3 leading-relaxed opacity-75">
                      Crée un compte auteur avec le même email et mot de passe, puis désactive ce compte lecteur (réversible) —
                      sinon la connexion resterait bloquée sur l'ancien compte lecteur.
                    </p>
                    {promoteError && <p className="text-sm text-rose-600">{promoteError}</p>}
                    <div className="flex justify-end gap-2.5">
                      <button type="button" onClick={() => setPromoteConfirmOpen(false)} disabled={isPromoting} className={btnClass}>
                        Annuler
                      </button>
                      <button type="button" onClick={handlePromote} disabled={isPromoting} className={btnPrimaryClass}>
                        {isPromoting ? 'Promotion…' : 'Confirmer la promotion'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 border-t border-black/10 pt-1 dark:border-white/10">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 px-4 py-3.5 dark:border-white/10">
                <span className="flex flex-col gap-0.5">
                  <strong className="text-[0.85rem]">Compte vérifié</strong>
                  <span className="text-xs leading-snug opacity-55">Distinct de la vérification KYC (gérée depuis l'onglet dédié).</span>
                </span>
                <Switch isOn={isAccountVerified} onToggle={() => !isSubmitting && setIsAccountVerified((v) => !v)} />
              </label>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-black/10 pt-1 dark:border-white/10">
            {!deleteConfirmOpen ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isSubmitting || isPromoting}
                className={`${btnClass} self-start !text-rose-600`}
              >
                Supprimer ce compte
              </button>
            ) : (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3.5 text-[0.8rem]">
                <p className="m-0 mb-3 leading-relaxed opacity-75">
                  {account.kind === 'user'
                    ? 'Le compte lecteur ne pourra plus se connecter. Réversible uniquement en base de données.'
                    : "Le compte auteur ne pourra plus se connecter ; ses livres déjà publiés restent en ligne. Réversible uniquement en base de données."}
                </p>
                {deleteError && <p className="text-sm text-rose-600">{deleteError}</p>}
                <div className="flex justify-end gap-2.5">
                  <button type="button" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting} className={btnClass}>
                    Annuler
                  </button>
                  <button type="button" onClick={handleDelete} disabled={isDeleting} className={btnDangerClass}>
                    {isDeleting ? 'Suppression…' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className={btnClass}>
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className={btnPrimaryClass}>
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
