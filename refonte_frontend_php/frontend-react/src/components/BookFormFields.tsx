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

// Rendu des champs de src/components/dashboard/author/BookForm.tsx — extrait
// en composant pur pour être réutilisé tel quel par BookWizard.tsx (par
// étape) et par le panneau d'édition de BookManageDashboard.tsx (d'un bloc).
export function BookFormFields({ form, set, categories }: Props) {
  const topicsChips = form.topics ? form.topics.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <>
      <label className="book-form__field">
        Titre
        <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={255} required />
      </label>

      <div className="book-form__row">
        <label className="book-form__field">
          Catégorie
          <select value={form.categoryId || ''} onChange={(e) => set('categoryId', Number(e.target.value))} required>
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
        <label className="book-form__field">
          Date de publication
          <input type="date" value={form.datePub} onChange={(e) => set('datePub', e.target.value)} required />
        </label>
      </div>

      <label className="book-form__field book-form__field--narrow">
        Langue
        <select value={form.language} onChange={(e) => set('language', e.target.value)}>
          {LANGUAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <CoverUploadField value={form.cover} onChange={(url) => set('cover', url)} />

      <label className="book-form__field">
        Lien du fichier (facultatif)
        <input type="text" value={form.bookLink} onChange={(e) => set('bookLink', e.target.value)} placeholder="https://…" />
      </label>

      <label className="book-form__field">
        Résumé
        <textarea value={form.resume} onChange={(e) => set('resume', e.target.value)} rows={4} required />
      </label>

      <div className="book-form__row book-form__row--3">
        <label className="book-form__field">
          Prix (FCFA)
          <input type="number" min={0} value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
        </label>
        <label className="book-form__field">
          Nombre de pages
          <input type="number" min={1} value={form.pageNumber} onChange={(e) => set('pageNumber', Number(e.target.value))} />
        </label>
        <label className="book-form__field">
          Chapitres gratuits
          <input type="number" min={0} value={form.freeChapterCount} onChange={(e) => set('freeChapterCount', Number(e.target.value))} />
        </label>
      </div>

      <div className="book-form__switches">
        <label>
          <input type="checkbox" checked={form.isFree} onChange={(e) => set('isFree', e.target.checked)} />
          Livre entièrement gratuit
        </label>
        <label>
          <input type="checkbox" checked={form.readBeforePay} onChange={(e) => set('readBeforePay', e.target.checked)} />
          Lecture avant paiement
        </label>
        <label>
          <input type="checkbox" checked={form.isPromotion} onChange={(e) => set('isPromotion', e.target.checked)} />
          En promotion
        </label>
        <label>
          <input type="checkbox" checked={form.isAdultOnly} onChange={(e) => set('isAdultOnly', e.target.checked)} />
          Public averti (+18)
        </label>
      </div>

      <label className="book-form__field book-form__field--narrow">
        Prix promotionnel (FCFA)
        <input type="number" min={0} value={form.promotionPrice} onChange={(e) => set('promotionPrice', Number(e.target.value))} />
      </label>

      <fieldset className="book-form__extension">
        <legend>Contenu enrichi (facultatif)</legend>
        <label className="book-form__field">
          Introduction
          <textarea value={form.introduction} onChange={(e) => set('introduction', e.target.value)} rows={3} />
        </label>
        <label className="book-form__field">
          Sujets abordés
          <ChipsInput
            value={topicsChips}
            onChange={(chips) => set('topics', chips.join(', '))}
            placeholder="Tapez un sujet puis Entrée…"
          />
        </label>
        <label className="book-form__field">
          Conclusion
          <textarea value={form.conclusion} onChange={(e) => set('conclusion', e.target.value)} rows={3} />
        </label>
      </fieldset>
    </>
  );
}
