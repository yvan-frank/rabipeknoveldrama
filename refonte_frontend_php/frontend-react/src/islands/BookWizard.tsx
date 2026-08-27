import { useEffect, useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage, getSessionUser } from '../lib/apiClient';
import { EMPTY_BOOK_FORM, LANGUAGE_OPTIONS, toBookApiPayload, type BookFormState } from '../lib/bookForm';
import { CoverUploadField } from '../components/CoverUploadField';
import { ChipsInput } from '../components/ChipsInput';

interface Category {
  id: number;
  name: string;
}

const DRAFT_KEY = 'author-book-draft';

function loadDraft(): Partial<BookFormState> | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(values: BookFormState) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    // stockage indisponible (navigation privée, quota) : on continue sans persistance
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // rien à faire si l'accès au storage échoue déjà
  }
}

interface Step {
  title: string;
  description: string;
  icon: string;
}

const STEPS: Step[] = [
  { title: 'Informations', description: 'Titre, catégorie et résumé', icon: '📖' },
  { title: 'Couverture', description: 'Image et fichier', icon: '🖼️' },
  { title: 'Tarification', description: "Prix et conditions d'accès", icon: '💰' },
  { title: 'Contenu enrichi', description: 'Introduction et conclusion (facultatif)', icon: '✨' },
  { title: 'Récapitulatif', description: 'Vérifiez avant de publier', icon: '✓' },
];

// Valide uniquement les champs pertinents pour l'étape courante — même
// découpage que STEPS.fields côté Next.js (bookFormSchema partiel via trigger()).
function validateStep(step: number, form: BookFormState): string | null {
  if (step === 0) {
    if (!form.title.trim()) return 'Le titre est requis';
    if (!form.categoryId) return 'Choisissez une catégorie';
    if (!form.resume.trim()) return 'Le résumé est requis';
  }
  if (step === 1) {
    if (!form.cover) return 'Ajoutez une image de couverture';
    if (!form.datePub) return 'La date de publication est requise';
    if (form.pageNumber < 1) return 'Le nombre de pages doit être au moins 1';
  }
  return null;
}

// Équivalent de src/components/dashboard/author/BookWizard.tsx : même
// BookFormState/toBookApiPayload que BookForm.tsx (cf. lib/bookForm.ts),
// mais présenté en 5 étapes avec brouillon persistant (localStorage) —
// seule la création (POST /books) passe par ici, l'édition se fait depuis
// BookManageDashboard.tsx.
export default function BookWizard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [hadDraft] = useState(() => Boolean(loadDraft()?.title));
  const [form, setForm] = useState<BookFormState>({ ...EMPTY_BOOK_FORM, ...loadDraft() });
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [authorId, setAuthorId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [kycBlocked, setKycBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getSessionUser().then((user) => setAuthorId(user?.authorId ?? null));
  }, []);

  useEffect(() => {
    apiClient
      .get('/categories')
      .then((res) => {
        const list: Category[] = res.data?.data ?? [];
        setCategories(list);
        setForm((f) => (f.categoryId ? f : list.length > 0 ? { ...f, categoryId: list[0].id } : f));
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoaded(true));
  }, []);

  // Ne persiste qu'une fois un titre saisi — évite de proposer de restaurer
  // un brouillon qui n'est encore que les valeurs par défaut.
  useEffect(() => {
    if (form.title) saveDraft(form);
  }, [form]);

  function set<K extends keyof BookFormState>(key: K, value: BookFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goNext() {
    const error = validateStep(step, form);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleRestart() {
    if (!window.confirm('Effacer le brouillon et recommencer ce livre depuis le début ?')) return;
    clearDraft();
    setForm({ ...EMPTY_BOOK_FORM, categoryId: categories[0]?.id ?? 0 });
    setStep(0);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setKycBlocked(false);

    if (!authorId) return setSubmitError('Session auteur introuvable — reconnectez-vous.');

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/books', { ...toBookApiPayload(form), authorId });
      clearDraft();
      const newId = res.data?.data?.id;
      window.location.href = newId ? `/espace-auteur/livres/${newId}` : '/espace-auteur/livres';
    } catch (err: any) {
      if (err?.response?.status === 403) setKycBlocked(true);
      setSubmitError(extractApiErrorMessage(err, 'Impossible de créer le livre'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentStep = STEPS[step];
  const isFirstStep = step === 0;
  const isLastStep = step === STEPS.length - 1;

  if (categoriesLoaded && categories.length === 0) {
    return (
      <p className="wizard__no-categories">
        Aucune catégorie n'existe encore — impossible de créer un livre tant qu'au moins une catégorie n'a pas été ajoutée.
      </p>
    );
  }

  return (
    <div className="wizard">
      {hadDraft && step === 0 && (
        <div className="wizard__draft-banner">
          <span>Brouillon restauré — reprenez là où vous vous étiez arrêté·e.</span>
          <button type="button" onClick={handleRestart}>
            Recommencer
          </button>
        </div>
      )}

      <div className="wizard__steps">
        {STEPS.map((s, index) => (
          <div key={s.title} className={`wizard__step${index === step ? ' is-current' : ''}${index < step ? ' is-done' : ''}`}>
            <span className="wizard__step-badge">{index < step ? '✓' : index + 1}</span>
            <span className="wizard__step-label">{s.title}</span>
          </div>
        ))}
      </div>

      <form className="wizard__panel" onSubmit={isLastStep ? handleSubmit : (e) => e.preventDefault()}>
        <div className="wizard__panel-head">
          <span>{currentStep.icon}</span>
          <div>
            <h2>{currentStep.title}</h2>
            <p>{currentStep.description}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="book-form">
            <label className="book-form__field">
              Titre
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={255} />
            </label>
            <div className="book-form__row">
              <label className="book-form__field">
                Catégorie
                <select value={form.categoryId || ''} onChange={(e) => set('categoryId', Number(e.target.value))}>
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
                Langue
                <select value={form.language} onChange={(e) => set('language', e.target.value)}>
                  {LANGUAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="book-form__field">
              Résumé
              <textarea value={form.resume} onChange={(e) => set('resume', e.target.value)} rows={5} />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="book-form">
            <CoverUploadField value={form.cover} onChange={(url) => set('cover', url)} />
            <label className="book-form__field">
              Lien du fichier (facultatif)
              <input type="text" value={form.bookLink} onChange={(e) => set('bookLink', e.target.value)} placeholder="https://…" />
              <span className="wizard__hint">Un livre géré uniquement via les chapitres n'a pas besoin de fichier externe.</span>
            </label>
            <div className="book-form__row">
              <label className="book-form__field">
                Date de publication
                <input type="date" value={form.datePub} onChange={(e) => set('datePub', e.target.value)} />
              </label>
              <label className="book-form__field">
                Nombre de pages
                <input type="number" min={1} value={form.pageNumber} onChange={(e) => set('pageNumber', Number(e.target.value))} />
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="book-form">
            <div className="book-form__switches">
              <label>
                <input type="checkbox" checked={form.isFree} onChange={(e) => set('isFree', e.target.checked)} />
                Livre entièrement gratuit
              </label>
              <label>
                <input type="checkbox" checked={form.isPromotion} onChange={(e) => set('isPromotion', e.target.checked)} />
                En promotion
              </label>
              <label>
                <input type="checkbox" checked={form.readBeforePay} onChange={(e) => set('readBeforePay', e.target.checked)} />
                Lecture avant paiement
              </label>
              <label>
                <input type="checkbox" checked={form.isAdultOnly} onChange={(e) => set('isAdultOnly', e.target.checked)} />
                Public averti (+18)
              </label>
            </div>
            {!form.isFree && (
              <div className="book-form__row">
                <label className="book-form__field">
                  Prix (FCFA)
                  <input type="number" min={0} value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
                </label>
                <label className="book-form__field">
                  Chapitres gratuits (aperçu)
                  <input type="number" min={0} value={form.freeChapterCount} onChange={(e) => set('freeChapterCount', Number(e.target.value))} />
                </label>
              </div>
            )}
            {form.isPromotion && (
              <label className="book-form__field book-form__field--narrow">
                Prix promotionnel (FCFA)
                <input type="number" min={0} value={form.promotionPrice} onChange={(e) => set('promotionPrice', Number(e.target.value))} />
              </label>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="book-form">
            <p className="wizard__hint">Ces trois champs sont entièrement facultatifs — laissez-les vides si non applicable.</p>
            <label className="book-form__field">
              Introduction
              <textarea value={form.introduction} onChange={(e) => set('introduction', e.target.value)} rows={4} />
            </label>
            <label className="book-form__field">
              Sujets abordés
              <ChipsInput
                value={form.topics ? form.topics.split(',').map((t) => t.trim()).filter(Boolean) : []}
                onChange={(chips) => set('topics', chips.join(', '))}
                placeholder="Tapez un sujet puis Entrée…"
              />
            </label>
            <label className="book-form__field">
              Conclusion
              <textarea value={form.conclusion} onChange={(e) => set('conclusion', e.target.value)} rows={4} />
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="wizard__recap">
            <div className="wizard__recap-head">
              {form.cover ? <img src={form.cover} alt="Couverture" /> : <div className="wizard__recap-nocover">Sans image</div>}
              <div>
                <p className="wizard__recap-title">{form.title || 'Sans titre'}</p>
                <p className="wizard__recap-category">{categories.find((c) => c.id === form.categoryId)?.name}</p>
                <p className="wizard__recap-resume">{form.resume}</p>
              </div>
            </div>

            <dl className="wizard__recap-grid">
              <RecapRow label="Prix" value={form.isFree ? 'Gratuit' : `${form.price} FCFA`} />
              <RecapRow label="Promotion" value={form.isPromotion ? `Oui — ${form.promotionPrice} FCFA` : 'Non'} />
              <RecapRow label="Chapitres gratuits (aperçu)" value={String(form.freeChapterCount)} />
              <RecapRow label="Lecture avant paiement" value={form.readBeforePay ? 'Oui' : 'Non'} />
              <RecapRow label="Public averti (+18)" value={form.isAdultOnly ? 'Oui' : 'Non'} />
              <RecapRow label="Pages" value={String(form.pageNumber)} />
              <RecapRow label="Fichier" value={form.bookLink || 'Aucun'} />
              <RecapRow label="Langue" value={LANGUAGE_OPTIONS.find((l) => l.value === form.language)?.label ?? 'Non précisée'} />
              <RecapRow label="Introduction/conclusion" value={form.introduction || form.conclusion || form.topics ? 'Renseignées' : 'Aucune'} />
            </dl>

            {submitError && (
              <p className="review-form__error">
                {submitError}
                {kycBlocked && (
                  <>
                    {' '}
                    <a href="/espace-auteur/kyc">Compléter mon KYC →</a>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {stepError && <p className="review-form__error">{stepError}</p>}

        <div className="wizard__nav">
          <button type="button" className="btn" onClick={goBack} disabled={isFirstStep}>
            ← Précédent
          </button>
          {isLastStep ? (
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Publication…' : 'Publier le livre'}
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={goNext}>
              Suivant →
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="wizard__recap-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
