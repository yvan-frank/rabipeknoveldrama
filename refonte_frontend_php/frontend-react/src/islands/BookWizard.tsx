import { useEffect, useState, type FormEvent } from 'react';
import { BookText, ImageIcon, Coins, Sparkles as SparklesIcon, CheckCircle2, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { EMPTY_BOOK_FORM, LANGUAGE_OPTIONS, toBookApiPayload, type BookFormState } from '../lib/bookForm';
import { CoverUploadField } from '../components/CoverUploadField';
import { ChipsInput } from '../components/ChipsInput';
import { Checkbox } from '../components/Checkbox';
import { glassPanel, inputBase, labelBase, btnPrimary, btnSecondary, errorText } from '../lib/authorUi';

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
  Icon: typeof BookText;
}

const STEPS: Step[] = [
  { title: 'Informations', description: 'Titre, catégorie et résumé', Icon: BookText },
  { title: 'Couverture', description: 'Image et fichier', Icon: ImageIcon },
  { title: 'Tarification', description: "Prix et conditions d'accès", Icon: Coins },
  { title: 'Contenu enrichi', description: 'Introduction et conclusion (facultatif)', Icon: SparklesIcon },
  { title: 'Récapitulatif', description: 'Vérifiez avant de publier', Icon: CheckCircle2 },
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

const rowClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2';
const checkboxCardClass = 'rounded-xl border border-white/10 bg-black/15 px-3.5 py-3 text-[0.85rem] text-white/75 transition hover:border-white/20';

// Équivalent de src/components/dashboard/author/BookWizard.tsx : même
// BookFormState/toBookApiPayload que BookForm.tsx (cf. lib/bookForm.ts),
// mais présenté en 5 étapes avec brouillon persistant (localStorage) —
// seule la création (POST /books) passe par ici, l'édition se fait depuis
// BookManageDashboard.tsx.
export default function BookWizard() {
  const user = useRequireAuth('/espace-auteur/livres/nouveau');
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
    setAuthorId(user?.authorId ?? null);
  }, [user]);

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

  if (!user) return null;

  if (categoriesLoaded && categories.length === 0) {
    return (
      <div className={`${glassPanel} mx-auto my-8 max-w-lg p-8 text-center`}>
        <p className="text-sm text-white/50">Aucune catégorie n'existe encore — impossible de créer un livre tant qu'au moins une catégorie n'a pas été ajoutée.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Nouveau livre</h1>
        <p className="mt-1.5 text-sm text-white/50">Publiez votre prochaine histoire en quelques étapes.</p>
      </div>

      {hadDraft && step === 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-amber/25 bg-brand-amber/10 px-4.5 py-3.5 text-[0.85rem] text-brand-amber">
          <span>Brouillon restauré — reprenez là où vous vous étiez arrêté·e.</span>
          <button type="button" onClick={handleRestart} className="inline-flex items-center gap-1 border-none bg-none text-[0.8rem] text-rose-300 underline">
            <RotateCcw size={12} /> Recommencer
          </button>
        </div>
      )}

      <div className="mb-5 flex items-center">
        {STEPS.map((s, index) => (
          <div key={s.title} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex w-full items-center">
              {index > 0 && <span className={`absolute right-1/2 h-px w-full ${index <= step ? 'bg-gradient-to-r from-brand-amber to-brand-pink' : 'bg-white/10'}`} />}
              <span
                className={`relative z-10 mx-auto flex size-9 items-center justify-center rounded-full text-[0.85rem] font-semibold transition ${
                  index === step
                    ? 'bg-gradient-to-br from-brand-amber to-brand-pink text-neutral-950 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]'
                    : index < step
                      ? 'bg-emerald-500/90 text-white'
                      : 'border border-white/15 bg-black/30 text-white/40'
                }`}
              >
                {index < step ? <CheckCircle2 size={16} /> : index + 1}
              </span>
            </div>
            <span className={`text-center text-[0.68rem] whitespace-nowrap ${index === step ? 'font-semibold text-white' : 'text-white/35'}`}>{s.title}</span>
          </div>
        ))}
      </div>

      <form className={`${glassPanel} p-6 sm:p-7`} onSubmit={isLastStep ? handleSubmit : (e) => e.preventDefault()}>
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber/20 to-brand-pink/20 text-brand-amber">
            <currentStep.Icon size={18} />
          </span>
          <div>
            <h2 className="text-[1.1rem] font-semibold text-white">{currentStep.title}</h2>
            <p className="mt-0.5 text-[0.8rem] text-white/45">{currentStep.description}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="flex max-w-2xl flex-col gap-4">
            <label className={labelBase}>
              Titre
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={255} className={inputBase} />
            </label>
            <div className={rowClass}>
              <label className={labelBase}>
                Catégorie
                <select value={form.categoryId || ''} onChange={(e) => set('categoryId', Number(e.target.value))} className={inputBase}>
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
              <label className={labelBase}>
                Langue
                <select value={form.language} onChange={(e) => set('language', e.target.value)} className={inputBase}>
                  {LANGUAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-neutral-900">
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={labelBase}>
              Résumé
              <textarea value={form.resume} onChange={(e) => set('resume', e.target.value)} rows={5} className={`${inputBase} resize-y`} />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="flex max-w-2xl flex-col gap-4">
            <CoverUploadField value={form.cover} onChange={(url) => set('cover', url)} />
            <label className={labelBase}>
              Lien du fichier (facultatif)
              <input type="text" value={form.bookLink} onChange={(e) => set('bookLink', e.target.value)} placeholder="https://…" className={inputBase} />
              <span className="text-xs text-white/35">Un livre géré uniquement via les chapitres n'a pas besoin de fichier externe.</span>
            </label>
            <div className={rowClass}>
              <label className={labelBase}>
                Date de publication
                <input type="date" value={form.datePub} onChange={(e) => set('datePub', e.target.value)} className={inputBase} />
              </label>
              <label className={labelBase}>
                Nombre de pages
                <input type="number" min={1} value={form.pageNumber} onChange={(e) => set('pageNumber', Number(e.target.value))} className={inputBase} />
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex max-w-2xl flex-col gap-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Checkbox checked={form.isFree} onChange={(v) => set('isFree', v)} className={checkboxCardClass}>
                Livre entièrement gratuit
              </Checkbox>
              <Checkbox checked={form.isPromotion} onChange={(v) => set('isPromotion', v)} className={checkboxCardClass}>
                En promotion
              </Checkbox>
              <Checkbox checked={form.readBeforePay} onChange={(v) => set('readBeforePay', v)} className={checkboxCardClass}>
                Lecture avant paiement
              </Checkbox>
              <Checkbox checked={form.isAdultOnly} onChange={(v) => set('isAdultOnly', v)} className={checkboxCardClass}>
                Public averti (+18)
              </Checkbox>
            </div>
            {!form.isFree && (
              <div className={rowClass}>
                <label className={labelBase}>
                  Prix (FCFA)
                  <input type="number" min={0} value={form.price} onChange={(e) => set('price', Number(e.target.value))} className={inputBase} />
                </label>
                <label className={labelBase}>
                  Chapitres gratuits (aperçu)
                  <input type="number" min={0} value={form.freeChapterCount} onChange={(e) => set('freeChapterCount', Number(e.target.value))} className={inputBase} />
                </label>
              </div>
            )}
            {form.isPromotion && (
              <label className={`${labelBase} max-w-56`}>
                Prix promotionnel (FCFA)
                <input type="number" min={0} value={form.promotionPrice} onChange={(e) => set('promotionPrice', Number(e.target.value))} className={inputBase} />
              </label>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="text-xs text-white/35">Ces trois champs sont entièrement facultatifs — laissez-les vides si non applicable.</p>
            <label className={labelBase}>
              Introduction
              <textarea value={form.introduction} onChange={(e) => set('introduction', e.target.value)} rows={4} className={`${inputBase} resize-y`} />
            </label>
            {/* <div>, pas <label> : ChipsInput contient ses propres <button>
                (retrait d'un chip) — cf. commentaire équivalent dans
                ChapterEditorPage.tsx pour RichTextEditor, même piège. */}
            <div className={labelBase}>
              Sujets abordés
              <ChipsInput
                value={form.topics ? form.topics.split(',').map((t) => t.trim()).filter(Boolean) : []}
                onChange={(chips) => set('topics', chips.join(', '))}
                placeholder="Tapez un sujet puis Entrée…"
              />
            </div>
            <label className={labelBase}>
              Conclusion
              <textarea value={form.conclusion} onChange={(e) => set('conclusion', e.target.value)} rows={4} className={`${inputBase} resize-y`} />
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              {form.cover ? (
                <img src={form.cover} alt="Couverture" className="h-28 w-20 shrink-0 rounded-lg object-cover shadow-lg" />
              ) : (
                <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[0.7rem] text-white/40">Sans image</div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-white">{form.title || 'Sans titre'}</p>
                <p className="my-1 text-xs text-white/40">{categories.find((c) => c.id === form.categoryId)?.name}</p>
                <p className="mt-2 line-clamp-3 text-[0.85rem] text-white/60">{form.resume}</p>
              </div>
            </div>

            <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className={errorText}>
                {submitError}
                {kycBlocked && (
                  <>
                    {' '}
                    <a href="/espace-auteur/kyc" className="text-brand-amber underline">
                      Compléter mon KYC →
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {stepError && <p className={`mt-4 ${errorText}`}>{stepError}</p>}

        <div className="mt-7 flex justify-between border-t border-white/10 pt-5">
          <button type="button" onClick={goBack} disabled={isFirstStep} className={btnSecondary}>
            <ArrowLeft size={15} /> Précédent
          </button>
          {isLastStep ? (
            <button type="submit" disabled={isSubmitting} className={btnPrimary}>
              {isSubmitting ? 'Publication…' : 'Publier le livre'}
            </button>
          ) : (
            <button type="button" onClick={goNext} className={btnPrimary}>
              Suivant <ArrowRight size={15} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 px-3.5 py-2.5">
      <dt className="text-[0.7rem] text-white/40">{label}</dt>
      <dd className="mt-0.5 overflow-hidden text-[0.85rem] font-semibold text-ellipsis whitespace-nowrap text-white">{value}</dd>
    </div>
  );
}
