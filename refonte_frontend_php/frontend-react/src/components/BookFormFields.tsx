import { LANGUAGE_OPTIONS, type BookFormState } from '../lib/bookForm';
import { CoverUploadField } from './CoverUploadField';
import { ChipsInput } from './ChipsInput';

interface Category {
  id: number;
  name: string;
}

interface Props {
  form: BookFormState;
  set: <K extends keyof BookFormState>(key: K, value: BookFormState[K]) => void;
  categories: Category[];
}

const fieldClass = 'flex flex-col gap-1.5 text-[0.8rem] opacity-85';
const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-brand-amber focus:ring-3 focus:ring-brand-amber/20 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100';

// Rendu des champs de src/components/dashboard/author/BookForm.tsx — extrait
// en composant pur pour être réutilisé tel quel par BookWizard.tsx (par
// étape) et par le panneau d'édition de BookManageDashboard.tsx (d'un bloc).
export function BookFormFields({ form, set, categories }: Props) {
  const topicsChips = form.topics ? form.topics.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <>
      <label className={fieldClass}>
        Titre
        <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={255} required className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={fieldClass}>
          Catégorie
          <select value={form.categoryId || ''} onChange={(e) => set('categoryId', Number(e.target.value))} required className={inputClass}>
            <option value="" disabled>
              Choisir…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          Date de publication
          <input type="date" value={form.datePub} onChange={(e) => set('datePub', e.target.value)} required className={inputClass} />
        </label>
      </div>

      <label className={`${fieldClass} max-w-56`}>
        Langue
        <select value={form.language} onChange={(e) => set('language', e.target.value)} className={inputClass}>
          {LANGUAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <CoverUploadField value={form.cover} onChange={(url) => set('cover', url)} />

      <label className={fieldClass}>
        Lien du fichier (facultatif)
        <input type="text" value={form.bookLink} onChange={(e) => set('bookLink', e.target.value)} placeholder="https://…" className={inputClass} />
      </label>

      <label className={fieldClass}>
        Résumé
        <textarea value={form.resume} onChange={(e) => set('resume', e.target.value)} rows={4} required className={`${inputClass} resize-y`} />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className={fieldClass}>
          Prix (FCFA)
          <input type="number" min={0} value={form.price} onChange={(e) => set('price', Number(e.target.value))} className={inputClass} />
        </label>
        <label className={fieldClass}>
          Nombre de pages
          <input
            type="number"
            min={1}
            value={form.pageNumber}
            onChange={(e) => set('pageNumber', Number(e.target.value))}
            className={inputClass}
          />
        </label>
        <label className={fieldClass}>
          Chapitres gratuits
          <input
            type="number"
            min={0}
            value={form.freeChapterCount}
            onChange={(e) => set('freeChapterCount', Number(e.target.value))}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
        <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2.5 text-[0.85rem] dark:border-white/10">
          <input type="checkbox" checked={form.isFree} onChange={(e) => set('isFree', e.target.checked)} />
          Livre entièrement gratuit
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2.5 text-[0.85rem] dark:border-white/10">
          <input type="checkbox" checked={form.readBeforePay} onChange={(e) => set('readBeforePay', e.target.checked)} />
          Lecture avant paiement
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2.5 text-[0.85rem] dark:border-white/10">
          <input type="checkbox" checked={form.isPromotion} onChange={(e) => set('isPromotion', e.target.checked)} />
          En promotion
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2.5 text-[0.85rem] dark:border-white/10">
          <input type="checkbox" checked={form.isAdultOnly} onChange={(e) => set('isAdultOnly', e.target.checked)} />
          Public averti (+18)
        </label>
      </div>

      <label className={`${fieldClass} max-w-56`}>
        Prix promotionnel (FCFA)
        <input
          type="number"
          min={0}
          value={form.promotionPrice}
          onChange={(e) => set('promotionPrice', Number(e.target.value))}
          className={inputClass}
        />
      </label>

      <fieldset className="flex flex-col gap-3.5 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <legend className="px-1.5 text-xs font-bold tracking-[0.05em] uppercase opacity-60">Contenu enrichi (facultatif)</legend>
        <label className={fieldClass}>
          Introduction
          <textarea value={form.introduction} onChange={(e) => set('introduction', e.target.value)} rows={3} className={`${inputClass} resize-y`} />
        </label>
        <label className={fieldClass}>
          Sujets abordés
          <ChipsInput
            value={topicsChips}
            onChange={(chips) => set('topics', chips.join(', '))}
            placeholder="Tapez un sujet puis Entrée…"
          />
        </label>
        <label className={fieldClass}>
          Conclusion
          <textarea value={form.conclusion} onChange={(e) => set('conclusion', e.target.value)} rows={3} className={`${inputClass} resize-y`} />
        </label>
      </fieldset>
    </>
  );
}
