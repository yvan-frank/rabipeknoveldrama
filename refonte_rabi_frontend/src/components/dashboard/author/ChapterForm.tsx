'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw } from 'lucide-react';
import { extractApiErrorMessage } from '@/lib/api-client';
import { chapterFormSchema, type ChapterFormValues } from '@/lib/schemas/book';
import { RichTextEditor } from './RichTextEditor';

interface ChapterFormProps {
  defaultValues?: Partial<ChapterFormValues>;
  onSubmit: (values: ChapterFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
  error?: unknown;
  onCancel: () => void;
  // Fourni uniquement pour la création (pas l'édition, où les données
  // serveur font déjà foi) : active la sauvegarde automatique du brouillon.
  // Effacé par l'appelant lui-même à la réussite de la mutation (cf.
  // BookManageDashboard) — pas ici, un effet sur ce composant ne serait pas
  // garanti de s'exécuter avant le démontage du panel qui suit le succès.
  draftKey?: string;
}

const inputClass =
  'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-amber/50 dark:border-white/20';
const labelClass = 'text-xs font-medium text-black/60 dark:text-white/60';

function loadChapterDraft(key: string): Partial<ChapterFormValues> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<ChapterFormValues>) : null;
  } catch {
    return null;
  }
}

function saveChapterDraft(key: string, values: ChapterFormValues) {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // stockage indisponible (navigation privée, quota) : on continue sans persistance
  }
}

function clearChapterDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // rien à faire si l'accès au storage échoue déjà
  }
}

export function ChapterForm({ defaultValues, onSubmit, isSubmitting, submitLabel, error, onCancel, draftKey }: ChapterFormProps) {
  const [draft] = useState(() => (draftKey ? loadChapterDraft(draftKey) : null));
  const [hasDraft, setHasDraft] = useState(() => Boolean(draft?.title || draft?.content));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: { title: '', chapterNumber: 1, content: '', introduction: '', ...defaultValues, ...draft },
  });

  const content = watch('content');

  useEffect(() => {
    if (!draftKey) return;
    const subscription = watch((values) => {
      if (!values.title && !values.content) return;
      saveChapterDraft(draftKey, { title: '', chapterNumber: 1, content: '', introduction: '', ...values });
    });
    return () => subscription.unsubscribe();
  }, [draftKey, watch]);

  function handleRestart() {
    if (!window.confirm('Effacer le brouillon et recommencer ce chapitre depuis le début ?')) return;
    if (draftKey) clearChapterDraft(draftKey);
    reset({ title: '', chapterNumber: defaultValues?.chapterNumber ?? 1, content: '', introduction: '' });
    setHasDraft(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {hasDraft && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-amber/30 bg-brand-amber/10 px-4 py-3 text-sm">
          <span>Brouillon restauré automatiquement.</span>
          <button type="button" onClick={handleRestart} className="flex shrink-0 items-center gap-1.5 font-medium text-rose-600 hover:underline dark:text-rose-300">
            <RotateCcw size={13} />
            Recommencer
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label className={labelClass}>Titre du chapitre</label>
          <input {...register('title')} className={`mt-1 ${inputClass}`} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <label className={labelClass}>N° du chapitre</label>
          <input type="number" {...register('chapterNumber', { valueAsNumber: true })} className={`mt-1 ${inputClass} sm:w-28`} />
          {errors.chapterNumber && <p className="mt-1 text-xs text-red-600">{errors.chapterNumber.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Introduction (optionnelle)</label>
        <textarea {...register('introduction')} rows={2} className={`mt-1 ${inputClass}`} />
      </div>

      <div>
        <label className={labelClass}>Contenu</label>
        <div className="mt-1">
          <RichTextEditor content={content} onChange={(html) => setValue('content', html, { shouldValidate: true, shouldDirty: true })} />
        </div>
        {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>}
      </div>

      {Boolean(error) && <p className="text-xs text-red-600">{extractApiErrorMessage(error, "Impossible d'enregistrer le chapitre")}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-50"
        >
          {isSubmitting ? 'Enregistrement…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-black/60 hover:underline dark:text-white/60">
          Annuler
        </button>
      </div>
    </form>
  );
}
