'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { extractApiErrorMessage } from '@/lib/api-client';
import { ChipsInput } from '@/components/ui/ChipsInput';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { bookFormSchema, type BookFormValues } from '@/lib/schemas/book';
import { CoverUploadField } from './CoverUploadField';
import type { Category } from '@/types/api';

interface BookFormProps {
  categories: Category[];
  defaultValues?: Partial<BookFormValues>;
  onSubmit: (values: BookFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
  error?: unknown;
  onCancel?: () => void;
}

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Non précisée' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'pt', label: 'Portugais' },
  { value: 'de', label: 'Allemand' },
];

const inputClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-amber/50 dark:border-white/20';
const labelClass = 'text-xs font-medium text-black/60 dark:text-white/60';

export function BookForm({ categories, defaultValues, onSubmit, isSubmitting, submitLabel, error, onCancel }: BookFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: '',
      datePub: new Date().toISOString().slice(0, 10),
      cover: '',
      bookLink: '',
      resume: '',
      price: 0,
      pageNumber: 1,
      categoryId: categories[0]?.id ?? 0,
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
      ...defaultValues,
    },
  });

  const cover = watch('cover');
  const topics = watch('topics');
  const topicsChips = topics ? topics.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Titre</label>
        <input {...register('title')} className={`mt-1 ${inputClass}`} />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Catégorie</label>
          <div className="mt-1">
            <Select options={categories.map((c) => ({ value: c.id, label: c.name }))} {...register('categoryId', { valueAsNumber: true })} />
          </div>
          {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Date de publication</label>
          <input type="date" {...register('datePub')} className={`mt-1 ${inputClass}`} />
          {errors.datePub && <p className="mt-1 text-xs text-red-600">{errors.datePub.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Langue</label>
        <div className="mt-1 sm:max-w-52">
          <Select options={LANGUAGE_OPTIONS} {...register('language')} />
        </div>
      </div>

      <CoverUploadField value={cover} onChange={(url) => setValue('cover', url, { shouldValidate: true })} error={errors.cover?.message} />

      <div>
        <label className={labelClass}>Lien du fichier (facultatif)</label>
        <input {...register('bookLink')} placeholder="https://… (laisser vide si non applicable)" className={`mt-1 ${inputClass}`} />
        {errors.bookLink && <p className="mt-1 text-xs text-red-600">{errors.bookLink.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Résumé</label>
        <textarea {...register('resume')} rows={4} className={`mt-1 ${inputClass}`} />
        {errors.resume && <p className="mt-1 text-xs text-red-600">{errors.resume.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Prix (FCFA)</label>
          <input type="number" {...register('price', { valueAsNumber: true })} className={`mt-1 ${inputClass}`} />
          {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Nombre de pages</label>
          <input type="number" {...register('pageNumber', { valueAsNumber: true })} className={`mt-1 ${inputClass}`} />
          {errors.pageNumber && <p className="mt-1 text-xs text-red-600">{errors.pageNumber.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Chapitres gratuits</label>
          <input type="number" {...register('freeChapterCount', { valueAsNumber: true })} className={`mt-1 ${inputClass}`} />
          {errors.freeChapterCount && <p className="mt-1 text-xs text-red-600">{errors.freeChapterCount.message}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Switch label="Livre entièrement gratuit" registration={register('isFree')} />
        <Switch label="Lecture avant paiement" registration={register('readBeforePay')} />
        <Switch label="En promotion" registration={register('isPromotion')} />
        <Switch
          label="Public averti (+18)"
          description="Demande une confirmation d'âge aux visiteurs avant d'afficher le livre."
          registration={register('isAdultOnly')}
        />
      </div>

      <div>
        <label className={labelClass}>Prix promotionnel (FCFA)</label>
        <input type="number" {...register('promotionPrice', { valueAsNumber: true })} className={`mt-1 ${inputClass} sm:max-w-40`} />
        {errors.promotionPrice && <p className="mt-1 text-xs text-red-600">{errors.promotionPrice.message}</p>}
      </div>

      <div className="rounded-xl border border-black/8 p-4 dark:border-white/10">
        <p className="mb-3 text-xs font-semibold tracking-wide text-black/45 uppercase dark:text-white/45">Contenu enrichi (facultatif)</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>Introduction</label>
            <textarea {...register('introduction')} rows={3} className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className={labelClass}>Sujets abordés</label>
            <div className="mt-1">
              <ChipsInput
                value={topicsChips}
                onChange={(chips) => setValue('topics', chips.join(', '), { shouldDirty: true })}
                placeholder="Tapez un sujet puis Entrée…"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Conclusion</label>
            <textarea {...register('conclusion')} rows={3} className={`mt-1 ${inputClass}`} />
          </div>
        </div>
      </div>

      {Boolean(error) && <p className="text-xs text-red-600">{extractApiErrorMessage(error, "Impossible d'enregistrer le livre")}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-50"
        >
          {isSubmitting ? 'Enregistrement…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-black/60 hover:underline dark:text-white/60">
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
