import { useEffect, useRef, useState } from 'react';

const CONFIRMATION_PHRASE = 'SUPPRIMER';

interface Props {
  title: string;
  description: string;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

// Modale générique de confirmation de suppression (case à cocher + phrase
// "SUPPRIMER" à saisir) — équivalent simplifié de DeleteBookModal.tsx /
// DeleteChapterModal.tsx, factorisé ici puisque les deux ne diffèrent que
// par le titre et le texte affichés (livre, chapitre, partie…).
export function DeleteConfirm({ title, description, isSubmitting, error, onClose, onConfirm }: Props) {
  const [consented, setConsented] = useState(false);
  const [phrase, setPhrase] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isReady = consented && phrase === CONFIRMATION_PHRASE;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}>
      <section role="dialog" aria-modal="true" className="modal">
        <p className="modal__eyebrow">Zone sensible</p>
        <h2>{title}</h2>
        <p className="modal__text">{description}</p>

        <label className="modal__consent">
          <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} disabled={isSubmitting} />
          Je comprends que cette suppression est définitive.
        </label>

        <label className="modal__field">
          Saisissez <strong>{CONFIRMATION_PHRASE}</strong> pour confirmer.
          <input
            ref={inputRef}
            value={phrase}
            onChange={(e) => setPhrase(e.target.value.toUpperCase())}
            onPaste={(e) => e.preventDefault()}
            autoComplete="off"
            disabled={isSubmitting}
            placeholder={CONFIRMATION_PHRASE}
          />
        </label>

        {error && <p className="review-form__error">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
          <button type="button" className="btn btn--danger" disabled={!isReady || isSubmitting} onClick={onConfirm}>
            {isSubmitting ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </div>
      </section>
    </div>
  );
}

export { CONFIRMATION_PHRASE };
