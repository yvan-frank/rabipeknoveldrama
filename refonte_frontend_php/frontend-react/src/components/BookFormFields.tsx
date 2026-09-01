import { LANGUAGE_OPTIONS, type BookFormState } from '../lib/bookForm';
import { CoverUploadField } from './CoverUploadField';
import { ChipsInput } from './ChipsInput';
import { Checkbox } from './Checkbox';
import { inputBase, labelBase } from '../lib/authorUi';

interface Category {
  id: number;
  name: string;
}

interface Props {
  form: BookFormState;
  set: <K extends keyof BookFormState>(key: K, value: BookFormState[K]) => void;
  categories: Category[];
}

// Seul usage restant : le panneau d'édition de BookManageDashboard.tsx
// (espace auteur, toujours sombre) — d'où la palette directement alignée
// sur authorUi.ts plutôt que des variantes dark:.
const fieldClass = labelBase;
const inputClass = inputBase;
const checkboxCardClass = 'rounded-xl border border-white/10 bg-black/15 px-3.5 py-3 text-[0.85rem] text-white/75 transition hover:border-white/20';

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={fieldClass}>
          Catégorie
          <select value={form.categoryId || ''} onChange={(e) => set('categoryId', Number(e.target.value))} required className={inputClass}>
            <option value="" disabled className="bg-neutral-900">
              Choisir…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-neutral-900">
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
            <option key={o.value} value={o.value} className="bg-neutral-900">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <Checkbox checked={form.isFree} onChange={(v) => set('isFree', v)} className={checkboxCardClass}>
          Livre entièrement gratuit
        </Checkbox>
        <Checkbox checked={form.readBeforePay} onChange={(v) => set('readBeforePay', v)} className={checkboxCardClass}>
          Lecture avant paiement
        </Checkbox>
        <Checkbox checked={form.isPromotion} onChange={(v) => set('isPromotion', v)} className={checkboxCardClass}>
          En promotion
        </Checkbox>
        <Checkbox checked={form.isAdultOnly} onChange={(v) => set('isAdultOnly', v)} className={checkboxCardClass}>
          Public averti (+18)
        </Checkbox>
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

      <fieldset className="flex flex-col gap-3.5 rounded-xl border border-white/10 bg-black/15 p-4">
        <legend className="px-1.5 text-[0.7rem] font-semibold tracking-[0.12em] text-white/40 uppercase">Contenu enrichi (facultatif)</legend>
        <label className={fieldClass}>
          Introduction
          <textarea value={form.introduction} onChange={(e) => set('introduction', e.target.value)} rows={3} className={`${inputClass} resize-y`} />
        </label>
        {/* <div>, pas <label> : ChipsInput contient ses propres <button>
            (retrait d'un chip) — cf. commentaire équivalent dans
            ChapterEditorPage.tsx pour RichTextEditor, même piège. */}
        <div className={fieldClass}>
          Sujets abordés
          <ChipsInput
            value={topicsChips}
            onChange={(chips) => set('topics', chips.join(', '))}
            placeholder="Tapez un sujet puis Entrée…"
          />
        </div>
        <label className={fieldClass}>
          Conclusion
          <textarea value={form.conclusion} onChange={(e) => set('conclusion', e.target.value)} rows={3} className={`${inputClass} resize-y`} />
        </label>
      </fieldset>
    </>
  );
}
