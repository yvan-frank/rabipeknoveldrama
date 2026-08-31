import { useState } from 'react';
import { apiClient, clearSession, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { DeleteConfirm } from '../components/DeleteConfirm';

// Chemin web de suppression de compte (exigé par Google Play même sans
// l'app installée) — même endpoint DELETE /auth/me que le bouton mobile
// (cf. refonte_rabi_mobile app/(app)/settings.tsx). Affiche aussi l'identité
// du compte connecté : la vue PHP (supprimer-compte.php) ne peut plus le
// faire elle-même, faute de lire le jeton (localStorage) côté serveur.
export default function DeleteMyAccountButton() {
  const user = useRequireAuth('/supprimer-mon-compte');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.delete('/auth/me');
      clearSession();
      window.location.href = '/';
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Impossible de supprimer le compte pour le moment.'));
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <p className="mb-1 text-sm opacity-70">
        Connecté en tant que <strong>{user.email}</strong>.
      </p>
      <p className="mx-auto mb-8 max-w-md text-sm opacity-70">
        La suppression est définitive : votre bibliothèque, vos points et votre progression de lecture seront perdus. Elle
        prend effet immédiatement, sans période de grâce.
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-block rounded-lg border-none bg-gradient-to-br from-rose-500 to-red-600 px-5 py-2.5 text-sm text-white"
      >
        Supprimer mon compte
      </button>

      {open && (
        <DeleteConfirm
          title="Supprimer votre compte"
          description="Votre bibliothèque, vos points et votre progression seront définitivement perdus. Cette action est irréversible."
          isSubmitting={isSubmitting}
          error={error}
          onClose={() => setOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
