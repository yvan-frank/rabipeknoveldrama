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
    <div
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
    >
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[30rem] rounded-[1.25rem] bg-white p-6 text-neutral-900 shadow-[0_20px_60px_rgb(0_0_0/30%)] dark:bg-neutral-900 dark:text-neutral-100"
      >
        <p className="m-0 text-[0.7rem] font-bold tracking-[0.1em] text-rose-500 uppercase">Zone sensible</p>
        <h2 className="my-2 text-[1.4rem]">{title}</h2>
        <p className="text-sm leading-relaxed opacity-70">{description}</p>

        <label className="my-5 flex cursor-pointer items-start gap-2.5 rounded-xl border border-black/10 p-3.5 text-sm dark:border-white/10">
          <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} disabled={isSubmitting} />
          Je comprends que cette suppression est définitive.
        </label>

        <label className="block text-sm font-semibold">
          Saisissez <strong>{CONFIRMATION_PHRASE}</strong> pour confirmer.
          <input
            ref={inputRef}
            value={phrase}
            onChange={(e) => setPhrase(e.target.value.toUpperCase())}
            onPaste={(e) => e.preventDefault()}
            autoComplete="off"
            disabled={isSubmitting}
            placeholder={CONFIRMATION_PHRASE}
            className="mt-2 block w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 font-mono font-bold tracking-[0.1em] text-neutral-900 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-block rounded-lg px-5 py-2.5 text-sm disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!isReady || isSubmitting}
            onClick={onConfirm}
            className="inline-block rounded-lg border-none bg-gradient-to-br from-rose-500 to-red-600 px-5 py-2.5 text-sm text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </div>
      </section>
    </div>
  );
}

export { CONFIRMATION_PHRASE };
