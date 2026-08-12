'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  RotateCcw,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import { useSession } from '@/hooks/useAuth';
import { ChipsInput } from '@/components/ui/ChipsInput';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { CoverUploadField } from './CoverUploadField';
import { bookFormSchema, toBookApiPayload, type BookFormValues } from '@/lib/schemas/book';
import type { ApiResponse, Category } from '@/types/api';

const DRAFT_KEY = 'author-book-draft';

const DEFAULT_VALUES: BookFormValues = {
  title: '',
  datePub: new Date().toISOString().slice(0, 10),
  cover: '',
  bookLink: '',
  resume: '',
  price: 0,
  pageNumber: 1,
  categoryId: 0,
  isFree: true,
  readBeforePay: false,
  freeChapterCount: 3,
  isPromotion: false,
  promotionPrice: 0,
  isAdultOnly: false,
  language: '',
  introduction: '',
  topics: '',
  conclusion: '',
};

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Non précisée' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'pt', label: 'Portugais' },
  { value: 'de', label: 'Allemand' },
];

function loadDraft(): Partial<BookFormValues> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<BookFormValues>) : null;
  } catch {
    return null;
  }
}

function saveDraft(values: BookFormValues) {
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
  icon: typeof BookOpen;
  fields: (keyof BookFormValues)[];
}

const STEPS: Step[] = [
  { title: 'Informations', description: 'Titre, catégorie et résumé', icon: BookOpen, fields: ['title', 'categoryId', 'language', 'resume'] },
  { title: 'Couverture', description: 'Image et fichier', icon: ImagePlus, fields: ['cover', 'bookLink', 'pageNumber', 'datePub'] },
  { title: 'Tarification', description: "Prix et conditions d'accès", icon: Wallet, fields: ['isFree', 'price', 'isPromotion', 'promotionPrice', 'readBeforePay', 'freeChapterCount', 'isAdultOnly'] },
  { title: 'Contenu enrichi', description: 'Introduction et conclusion (facultatif)', icon: Sparkles, fields: ['introduction', 'topics', 'conclusion'] },
  { title: 'Récapitulatif', description: 'Vérifiez avant de publier', icon: Check, fields: [] },
];

const inputClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-amber/50 dark:border-white/20';
const labelClass = 'text-xs font-medium text-black/60 dark:text-white/60';

export function BookWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useSession();
  const [step, setStep] = useState(0);
  const [hadDraft] = useState(() => Boolean(loadDraft()?.title));

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    mode: 'onChange',
    defaultValues: { ...DEFAULT_VALUES, ...loadDraft() },
  });

  const { register, handleSubmit, trigger, setValue, watch, formState } = form;

  useEffect(() => {
    // Rien d'utile à restaurer tant que le titre n'est pas renseigné — évite
    // de persister (et donc de proposer de restaurer) un brouillon qui n'est
    // encore que les valeurs par défaut.
    const subscription = watch((values) => {
      if (!values.title) return;
      saveDraft({ ...DEFAULT_VALUES, ...values });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Catégorie par défaut dès que la liste arrive, si aucune n'est déjà choisie
  // (brouillon restauré ou premier passage).
  useEffect(() => {
    if (categoriesQuery.data?.length && !watch('categoryId')) {
      setValue('categoryId', categoriesQuery.data[0].id);
    }
  }, [categoriesQuery.data, setValue, watch]);

  const createBook = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { data } = await apiClient.post<ApiResponse<{ id: number }>>('/books', {
        ...toBookApiPayload(values),
        authorId: user!.authorId,
      });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (book) => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['author', 'books'] });
      router.push(`/espace-auteur/livres/${book.id}`);
    },
  });

  const categories = categoriesQuery.data ?? [];
  const values = watch();
  const { isFree, isPromotion } = values;
  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const isFirstStep = step === 0;

  const categoryOptions = useMemo(
    () => (categoriesQuery.data ?? []).map((category) => ({ value: category.id, label: category.name })),
    [categoriesQuery.data],
  );

  async function goNext() {
    const isValid = await trigger(currentStep.fields);
    if (!isValid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleRestart() {
    if (!window.confirm('Effacer le brouillon et recommencer ce livre depuis le début ?')) return;
    clearDraft();
    form.reset(DEFAULT_VALUES);
    setStep(0);
  }

  if (categoriesQuery.isSuccess && categories.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-black/50 dark:border-white/20 dark:text-white/50">
        Aucune catégorie n&apos;existe encore — impossible de créer un livre tant qu&apos;au moins une catégorie n&apos;a pas été ajoutée.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-0">
      {hadDraft && step === 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-amber/30 bg-brand-amber/10 px-4 py-3 text-sm">
          <span>Brouillon restauré — reprenez là où vous vous étiez arrêté·e.</span>
          <button type="button" onClick={handleRestart} className="flex shrink-0 items-center gap-1.5 font-medium text-rose-600 hover:underline dark:text-rose-300">
            <RotateCcw size={13} />
            Recommencer
          </button>
        </div>
      )}

      {/* Indicateur d'étapes : version compacte mobile (barre + libellé), version complète desktop (jalons). */}
      <div className="lg:hidden">
        <p className="text-sm font-medium">
          Étape {step + 1}/{STEPS.length} · {currentStep.title}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-amber to-brand-pink transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="hidden items-center lg:flex">
        {STEPS.map((s, index) => (
          <div key={s.title} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                  index < step
                    ? 'bg-emerald-500 text-white'
                    : index === step
                      ? 'bg-gradient-to-r from-brand-amber to-brand-pink text-black'
                      : 'bg-black/8 text-black/40 dark:bg-white/10 dark:text-white/40'
                }`}
              >
                {index < step ? <Check size={16} /> : index + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${index === step ? '' : 'text-black/45 dark:text-white/45'}`}>{s.title}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 rounded-full transition ${index < step ? 'bg-emerald-500' : 'bg-black/8 dark:bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit((v) => createBook.mutate(v))} className="rounded-2xl border border-black/10 p-5 sm:p-6 dark:border-white/15">
        <div className="mb-5 flex items-center gap-2">
          <currentStep.icon size={18} className="text-amber-500 dark:text-amber-300" />
          <div>
            <h2 className="text-base font-semibold">{currentStep.title}</h2>
            <p className="text-xs text-black/45 dark:text-white/45">{currentStep.description}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Titre</label>
              <input {...register('title')} className={`mt-1 ${inputClass}`} />
              {formState.errors.title && <p className="mt-1 text-xs text-red-600">{formState.errors.title.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Catégorie</label>
                <div className="mt-1">
                  <Select options={categoryOptions} {...register('categoryId', { valueAsNumber: true })} />
                </div>
                {formState.errors.categoryId && <p className="mt-1 text-xs text-red-600">{formState.errors.categoryId.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Langue</label>
                <div className="mt-1">
                  <Select options={LANGUAGE_OPTIONS} {...register('language')} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Résumé</label>
              <textarea {...register('resume')} rows={5} className={`mt-1 ${inputClass}`} />
              {formState.errors.resume && <p className="mt-1 text-xs text-red-600">{formState.errors.resume.message}</p>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <CoverUploadField value={values.cover} onChange={(url) => setValue('cover', url, { shouldValidate: true })} error={formState.errors.cover?.message} />
            <div>
              <label className={labelClass}>Lien du fichier (facultatif)</label>
              <input {...register('bookLink')} placeholder="https://… (laisser vide si non applicable)" className={`mt-1 ${inputClass}`} />
              <p className="mt-1 text-xs text-black/40 dark:text-white/40">Un livre géré uniquement via les chapitres n&apos;a pas besoin de fichier externe.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Date de publication</label>
                <input type="date" {...register('datePub')} className={`mt-1 ${inputClass}`} />
                {formState.errors.datePub && <p className="mt-1 text-xs text-red-600">{formState.errors.datePub.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Nombre de pages</label>
                <input type="number" {...register('pageNumber', { valueAsNumber: true })} className={`mt-1 ${inputClass}`} />
                {formState.errors.pageNumber && <p className="mt-1 text-xs text-red-600">{formState.errors.pageNumber.message}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Switch label="Livre entièrement gratuit" description="Tous les chapitres sont accessibles sans achat." registration={register('isFree')} />
            {!isFree && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Prix (FCFA)</label>
                  <input type="number" {...register('price', { valueAsNumber: true })} className={`mt-1 ${inputClass}`} />
                </div>
                <div>
                  <label className={labelClass}>Chapitres gratuits (aperçu)</label>
                  <input type="number" {...register('freeChapterCount', { valueAsNumber: true })} className={`mt-1 ${inputClass}`} />
                </div>
              </div>
            )}
            <Switch label="En promotion" description="Affiche un prix barré et un prix promotionnel." registration={register('isPromotion')} />
            {isPromotion && (
              <div>
                <label className={labelClass}>Prix promotionnel (FCFA)</label>
                <input type="number" {...register('promotionPrice', { valueAsNumber: true })} className={`mt-1 ${inputClass} sm:max-w-40`} />
              </div>
            )}
            <Switch label="Lecture avant paiement" description="Le lecteur peut commencer à lire avant de finaliser l'achat." registration={register('readBeforePay')} />
            <Switch
              label="Public averti (+18)"
              description="Demande une confirmation d'âge aux visiteurs avant d'afficher le livre."
              registration={register('isAdultOnly')}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-black/45 dark:text-white/45">Ces trois champs sont entièrement facultatifs — laissez-les vides si non applicable.</p>
            <div>
              <label className={labelClass}>Introduction</label>
              <textarea {...register('introduction')} rows={4} className={`mt-1 ${inputClass}`} />
            </div>
            <div>
              <label className={labelClass}>Sujets abordés</label>
              <div className="mt-1">
                <ChipsInput
                  value={values.topics ? values.topics.split(',').map((t) => t.trim()).filter(Boolean) : []}
                  onChange={(chips) => setValue('topics', chips.join(', '), { shouldDirty: true })}
                  placeholder="Tapez un sujet puis Entrée…"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Conclusion</label>
              <textarea {...register('conclusion')} rows={4} className={`mt-1 ${inputClass}`} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4 rounded-xl border border-black/8 bg-black/[0.02] p-4 dark:border-white/8 dark:bg-white/[0.035]">
              {values.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.cover} alt="Couverture" width={80} height={112} className="h-28 w-20 shrink-0 rounded-lg object-cover shadow" />
              ) : (
                <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-black/5 text-xs text-black/40 dark:bg-white/10 dark:text-white/40">
                  Sans image
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold">{values.title || 'Sans titre'}</p>
                <p className="mt-1 text-xs text-black/50 dark:text-white/50">{categories.find((c) => c.id === values.categoryId)?.name}</p>
                <p className="mt-2 text-sm text-black/70 dark:text-white/70">{values.resume}</p>
              </div>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <RecapRow label="Prix" value={values.isFree ? 'Gratuit' : `${values.price} FCFA`} />
              <RecapRow label="Promotion" value={values.isPromotion ? `Oui — ${values.promotionPrice} FCFA` : 'Non'} />
              <RecapRow label="Chapitres gratuits (aperçu)" value={String(values.freeChapterCount)} />
              <RecapRow label="Lecture avant paiement" value={values.readBeforePay ? 'Oui' : 'Non'} />
              <RecapRow label="Public averti (+18)" value={values.isAdultOnly ? 'Oui' : 'Non'} />
              <RecapRow label="Pages" value={String(values.pageNumber)} />
              <RecapRow label="Fichier" value={values.bookLink || 'Aucun'} />
              <RecapRow label="Langue" value={LANGUAGE_OPTIONS.find((l) => l.value === values.language)?.label ?? 'Non précisée'} />
              <RecapRow label="Introduction/conclusion" value={values.introduction || values.conclusion || values.topics ? 'Renseignées' : 'Aucune'} />
            </dl>

            {createBook.isError && (
              <p className="text-xs text-red-600">{extractApiErrorMessage(createBook.error, 'Impossible de créer le livre')}</p>
            )}
          </div>
        )}

        {/* Navigation desktop, inline sous le formulaire */}
        <div className="mt-6 hidden items-center justify-between lg:flex">
          <button
            type="button"
            onClick={goBack}
            disabled={isFirstStep}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium disabled:opacity-30 dark:border-white/15"
          >
            <ChevronLeft size={16} />
            Précédent
          </button>
          {isLastStep ? (
            <button
              type="submit"
              disabled={createBook.isPending}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {createBook.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Publier le livre
            </button>
          ) : (
            <button type="button" onClick={goNext} className="flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">
              Suivant
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Navigation mobile : barre fixe en bas, toujours accessible au pouce. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-black/10 bg-background p-4 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] lg:hidden dark:border-white/15">
        <button
          type="button"
          onClick={goBack}
          disabled={isFirstStep}
          className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2.5 text-sm font-medium disabled:opacity-30 dark:border-white/15"
        >
          <ChevronLeft size={16} />
          Précédent
        </button>
        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit((v) => createBook.mutate(v))}
            disabled={createBook.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {createBook.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Publier
          </button>
        ) : (
          <button type="button" onClick={goNext} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">
            Suivant
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/8 px-3 py-2 dark:border-white/10">
      <dt className="text-xs text-black/45 dark:text-white/45">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}
