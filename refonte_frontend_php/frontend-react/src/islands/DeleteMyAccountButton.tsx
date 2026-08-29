import { useState } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { DeleteConfirm } from '../components/DeleteConfirm';

// Chemin web de suppression de compte (exigé par Google Play même sans
// l'app installée) — même endpoint DELETE /auth/me que le bouton mobile
// (cf. refonte_rabi_mobile app/(app)/settings.tsx).
export default function DeleteMyAccountButton() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.delete('/auth/me');
      window.location.href = '/';
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Impossible de supprimer le compte pour le moment.'));
      setIsSubmitting(false);
    }
  }

  return (
    <>
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
