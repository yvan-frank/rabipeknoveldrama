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

const fieldClass = 'flex flex-col gap-1.5 text-[0.8rem] opacity-85';
const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-brand-amber focus:ring-3 focus:ring-brand-amber/20 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100';
const rowClass = 'grid grid-cols-2 gap-4';
const bookFormClass = 'flex max-w-2xl flex-col gap-4';
const btnClass = 'inline-block rounded-lg px-5 py-2.5 text-sm disabled:opacity-60';
const btnPrimaryClass =
  'inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900';

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
      <p className="mx-auto my-8 max-w-lg rounded-2xl border border-dashed border-black/10 p-8 text-center opacity-60 dark:border-white/10">
        Aucune catégorie n'existe encore — impossible de créer un livre tant qu'au moins une catégorie n'a pas été ajoutée.
      </p>
    );
  }

  return (
    <div>
      {hadDraft && step === 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-brand-amber bg-brand-amber/10 px-4 py-3 text-[0.85rem]">
          <span>Brouillon restauré — reprenez là où vous vous étiez arrêté·e.</span>
          <button type="button" onClick={handleRestart} className="border-none bg-none text-[0.8rem] text-rose-600 underline">
            Recommencer
          </button>
        </div>
      )}

      <div className="flex items-center">
        {STEPS.map((s, index) => (
          <div key={s.title} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-[0.85rem] font-semibold ${
                index === step
                  ? 'bg-gradient-to-br from-brand-amber to-brand-pink text-neutral-900'
                  : index < step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-black/10 dark:bg-white/10'
              }`}
            >
              {index < step ? '✓' : index + 1}
            </span>
            <span className={`text-[0.7rem] whitespace-nowrap opacity-65 ${index === step ? 'font-semibold opacity-100' : ''}`}>{s.title}</span>
          </div>
        ))}
      </div>

      <form
        className="mt-4 rounded-[1.25rem] border border-black/10 p-6 dark:border-white/10"
        onSubmit={isLastStep ? handleSubmit : (e) => e.preventDefault()}
      >
        <div className="mb-5 flex items-center gap-3">
          <span>{currentStep.icon}</span>
          <div>
            <h2 className="m-0 text-[1.1rem]">{currentStep.title}</h2>
            <p className="mt-0.5 text-[0.8rem] opacity-60">{currentStep.description}</p>
          </div>
        </div>

        {step === 0 && (
          <div className={bookFormClass}>
            <label className={fieldClass}>
              Titre
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={255} className={inputClass} />
            </label>
            <div className={rowClass}>
              <label className={fieldClass}>
                Catégorie
                <select value={form.categoryId || ''} onChange={(e) => set('categoryId', Number(e.target.value))} className={inputClass}>
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
                Langue
                <select value={form.language} onChange={(e) => set('language', e.target.value)} className={inputClass}>
                  {LANGUAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={fieldClass}>
              Résumé
              <textarea value={form.resume} onChange={(e) => set('resume', e.target.value)} rows={5} className={`${inputClass} resize-y`} />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className={bookFormClass}>
            <CoverUploadField value={form.cover} onChange={(url) => set('cover', url)} />
            <label className={fieldClass}>
              Lien du fichier (facultatif)
              <input type="text" value={form.bookLink} onChange={(e) => set('bookLink', e.target.value)} placeholder="https://…" className={inputClass} />
              <span className="text-xs opacity-55">Un livre géré uniquement via les chapitres n'a pas besoin de fichier externe.</span>
            </label>
            <div className={rowClass}>
              <label className={fieldClass}>
                Date de publication
                <input type="date" value={form.datePub} onChange={(e) => set('datePub', e.target.value)} className={inputClass} />
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
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={bookFormClass}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
              <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2.5 text-[0.85rem] dark:border-white/10">
                <input type="checkbox" checked={form.isFree} onChange={(e) => set('isFree', e.target.checked)} />
                Livre entièrement gratuit
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2.5 text-[0.85rem] dark:border-white/10">
                <input type="checkbox" checked={form.isPromotion} onChange={(e) => set('isPromotion', e.target.checked)} />
                En promotion
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2.5 text-[0.85rem] dark:border-white/10">
                <input type="checkbox" checked={form.readBeforePay} onChange={(e) => set('readBeforePay', e.target.checked)} />
                Lecture avant paiement
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3.5 py-2.5 text-[0.85rem] dark:border-white/10">
                <input type="checkbox" checked={form.isAdultOnly} onChange={(e) => set('isAdultOnly', e.target.checked)} />
                Public averti (+18)
              </label>
            </div>
            {!form.isFree && (
              <div className={rowClass}>
                <label className={fieldClass}>
                  Prix (FCFA)
                  <input type="number" min={0} value={form.price} onChange={(e) => set('price', Number(e.target.value))} className={inputClass} />
                </label>
                <label className={fieldClass}>
                  Chapitres gratuits (aperçu)
                  <input
                    type="number"
                    min={0}
                    value={form.freeChapterCount}
                    onChange={(e) => set('freeChapterCount', Number(e.target.value))}
                    className={inputClass}
                  />
                </label>
              </div>
            )}
            {form.isPromotion && (
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
            )}
          </div>
        )}

        {step === 3 && (
          <div className={bookFormClass}>
            <p className="text-xs opacity-55">Ces trois champs sont entièrement facultatifs — laissez-les vides si non applicable.</p>
            <label className={fieldClass}>
              Introduction
              <textarea value={form.introduction} onChange={(e) => set('introduction', e.target.value)} rows={4} className={`${inputClass} resize-y`} />
            </label>
            <label className={fieldClass}>
              Sujets abordés
              <ChipsInput
                value={form.topics ? form.topics.split(',').map((t) => t.trim()).filter(Boolean) : []}
                onChange={(chips) => set('topics', chips.join(', '))}
                placeholder="Tapez un sujet puis Entrée…"
              />
            </label>
            <label className={fieldClass}>
              Conclusion
              <textarea value={form.conclusion} onChange={(e) => set('conclusion', e.target.value)} rows={4} className={`${inputClass} resize-y`} />
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-4 rounded-2xl border border-black/10 p-4 dark:border-white/10">
              {form.cover ? (
                <img src={form.cover} alt="Couverture" className="h-28 w-20 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-black/10 text-[0.7rem] opacity-60 dark:bg-white/10">
                  Sans image
                </div>
              )}
              <div>
                <p className="m-0 font-bold">{form.title || 'Sans titre'}</p>
                <p className="my-1 text-xs opacity-60">{categories.find((c) => c.id === form.categoryId)?.name}</p>
                <p className="mt-2 text-[0.85rem] opacity-80">{form.resume}</p>
              </div>
            </div>

            <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
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
              <p className="text-sm text-rose-600">
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

        {stepError && <p className="text-sm text-rose-600">{stepError}</p>}

        <div className="mt-6 flex justify-between">
          <button type="button" onClick={goBack} disabled={isFirstStep} className={btnClass}>
            ← Précédent
          </button>
          {isLastStep ? (
            <button type="submit" disabled={isSubmitting} className={btnPrimaryClass}>
              {isSubmitting ? 'Publication…' : 'Publier le livre'}
            </button>
          ) : (
            <button type="button" onClick={goNext} className={btnPrimaryClass}>
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
    <div className="rounded-lg border border-black/10 px-3.5 py-2.5 dark:border-white/10">
      <dt className="text-[0.7rem] opacity-55">{label}</dt>
      <dd className="mt-0.5 overflow-hidden text-[0.85rem] font-semibold text-ellipsis whitespace-nowrap">{value}</dd>
    </div>
  );
}
