import { useEffect, useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { formatPrice } from '../lib/formatPrice';
import { bookToFormState, toBookApiPayload, type BookFormState } from '../lib/bookForm';
import { BookFormFields } from '../components/BookFormFields';
import { DeleteConfirm, CONFIRMATION_PHRASE } from '../components/DeleteConfirm';
import { RichTextEditor } from '../components/RichTextEditor';

interface Category {
  id: number;
  name: string;
}

interface ChapterSummary {
  id: number;
  title: string;
  chapterNumber: number;
  partId: number | null;
}

interface BookPart {
  id: number;
  title: string;
  partNumber: number;
  price: number;
  isFree: boolean;
  freeChapterCount: number;
  chapters: ChapterSummary[];
}

interface BookDetail {
  id: number;
  title: string;
  slug: string;
  cover: string;
  resume: string;
  price: number;
  isFree: boolean;
  isPromotion: boolean;
  promotionPrice: number;
  categoryId: number;
  category: { id: number; name: string };
  parts: BookPart[];
  chapters: ChapterSummary[];
}

interface ChapterFormState {
  title: string;
  chapterNumber: number;
  content: string;
  introduction: string;
}

const EMPTY_CHAPTER_FORM: ChapterFormState = { title: '', chapterNumber: 1, content: '', introduction: '' };

function chapterPayload(form: ChapterFormState) {
  const { introduction, ...rest } = form;
  return { ...rest, extension: introduction ? { introduction } : undefined };
}

// Brouillon localStorage — uniquement pour la création (pas l'édition, où
// les données serveur font déjà foi), même règle que
// refonte_rabi_frontend/src/components/dashboard/author/ChapterForm.tsx.
function loadChapterDraft(key: string): Partial<ChapterFormState> | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveChapterDraft(key: string, values: ChapterFormState) {
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

const panelClass = 'rounded-[1.25rem] border border-black/10 px-6 py-5 dark:border-white/10';
const panelDescriptionClass = 'mt-1 mb-4 text-[0.8rem] opacity-60';
const panelHeadClass = 'mb-4 flex items-start justify-between gap-4';
const badgeClass = 'inline-block rounded-full bg-black/10 px-2 py-0.5 text-[0.7rem] font-semibold dark:bg-white/10';
const badgeFreeClass = 'inline-block rounded-full bg-brand-amber/20 px-2 py-0.5 text-[0.7rem] font-semibold text-brand-amber';
const errorClass = 'text-sm text-rose-600';
const btnClass = 'inline-block rounded-lg px-5 py-2.5 text-sm disabled:opacity-60';
const btnPrimaryClass =
  'inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900';
const btnDangerClass =
  'inline-block rounded-lg border-none bg-gradient-to-br from-rose-500 to-red-600 px-5 py-2.5 text-sm text-white disabled:opacity-60';
const iconBtnClass = 'rounded border-none bg-none p-1 text-base opacity-50 hover:bg-rose-600/10 hover:opacity-100';
const fieldClass = 'flex flex-col gap-1.5 text-[0.8rem] opacity-85';
const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-brand-amber focus:ring-3 focus:ring-brand-amber/20 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100';
const rowClass = 'grid grid-cols-2 gap-4';
const bookFormClass = 'flex max-w-2xl flex-col gap-4';
const bookFormActionsClass = 'flex items-center gap-3';
const manageListInputClass =
  'rounded-lg border border-black/10 bg-white px-2.5 py-2 text-[0.85rem] text-neutral-900 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100';

// --- Parties -----------------------------------------------------------

function PartsManager({ bookId, parts, onChanged }: { bookId: number; parts: BookPart[]; onChanged: () => void }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [freeChapterCount, setFreeChapterCount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const partNumber = Math.max(0, ...parts.map((p) => p.partNumber)) + 1;
      await apiClient.post('/book-parts', { bookId, title: title.trim(), partNumber, price, isFree, freeChapterCount });
      setTitle('');
      setPrice(0);
      setIsFree(false);
      setFreeChapterCount(0);
      onChanged();
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Impossible de créer la partie.'));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(part: BookPart) {
    if (!window.confirm(`Supprimer la partie « ${part.title} » ? Ses chapitres resteront dans le livre.`)) return;
    try {
      await apiClient.delete(`/book-parts/${part.id}`);
      onChanged();
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Impossible de supprimer cette partie.'));
    }
  }

  return (
    <section className={panelClass}>
      <div className={panelHeadClass}>
        <div>
          <h2 className="m-0 text-[1.1rem]">Parties à vendre</h2>
          <p className={panelDescriptionClass}>Chaque partie est achetée séparément et peut contenir plusieurs chapitres.</p>
        </div>
        <span className={badgeClass}>
          {parts.length} partie{parts.length > 1 ? 's' : ''}
        </span>
      </div>

      <form
        className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-dashed border-black/10 p-4 dark:border-white/10"
        onSubmit={handleCreate}
      >
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la partie" className={manageListInputClass} />
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          disabled={isFree}
          placeholder="Prix FCFA"
          className={manageListInputClass}
        />
        <label className="flex items-center gap-1.5 text-[0.85rem]">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Partie gratuite
        </label>
        <input
          type="number"
          min={0}
          value={freeChapterCount}
          onChange={(e) => setFreeChapterCount(Number(e.target.value))}
          placeholder="Chapitres gratuits"
          className={manageListInputClass}
        />
        <button type="submit" disabled={isCreating || !title.trim()} className={`${btnPrimaryClass} col-span-full w-fit`}>
          {isCreating ? 'Création…' : 'Ajouter une partie'}
        </button>
      </form>
      {error && <p className={errorClass}>{error}</p>}

      {parts.length === 0 ? (
        <p className="opacity-60">Ajoutez une partie pour proposer une vente par section.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {parts.map((part) => (
            <li key={part.id} className="flex items-center gap-3 rounded-xl border border-black/10 px-3.5 py-2.5 dark:border-white/10">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-amber/15 text-[0.85rem] font-bold text-brand-amber">
                {part.partNumber}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap">{part.title}</span>
                <span className="text-[0.7rem] opacity-55">
                  {part.chapters.length} chapitre{part.chapters.length > 1 ? 's' : ''} · {part.isFree ? 'Gratuite' : `${formatPrice(part.price)} FCFA`}
                </span>
              </span>
              <button type="button" onClick={() => handleDelete(part)} aria-label={`Supprimer ${part.title}`} className={iconBtnClass}>
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// --- Offrir le livre -----------------------------------------------------

function GrantPanel({ bookId, bookTitle }: { bookId: number; bookTitle: string }) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await apiClient.post(`/books/${bookId}/grants`, { email: email.trim(), ...(note.trim() ? { note: note.trim() } : {}) });
      setEmail('');
      setNote('');
      setSuccess(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Impossible d'attribuer ce livre."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={panelClass}>
      <h2 className="m-0 text-[1.1rem]">Offrir ce livre</h2>
      <p className={panelDescriptionClass}>Accordez l'accès complet à « {bookTitle} » à un lecteur.</p>
      <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-xs opacity-75">
          E-mail du lecteur
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={manageListInputClass} />
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs opacity-75">
          Note interne (facultative)
          <input type="text" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={manageListInputClass} />
        </label>
        <button type="submit" disabled={isSubmitting || !email.trim()} className={btnPrimaryClass}>
          {isSubmitting ? 'Attribution…' : 'Attribuer le livre'}
        </button>
      </form>
      {error && <p className={errorClass}>{error}</p>}
      {success && <p className="text-[0.85rem] text-emerald-500">Livre attribué avec succès.</p>}
    </section>
  );
}

// --- Chapitres -----------------------------------------------------------

function ChapterEditor({
  title,
  initial,
  isSubmitting,
  error,
  submitLabel,
  draftKey,
  onSubmit,
  onClose,
}: {
  title: string;
  initial: ChapterFormState;
  isSubmitting: boolean;
  error: string | null;
  submitLabel: string;
  // Fourni uniquement pour la création : active la sauvegarde automatique du
  // brouillon. Effacé par l'appelant à la réussite de la mutation, pas ici —
  // un effet sur ce composant n'est pas garanti de s'exécuter avant le
  // démontage du panel qui suit le succès.
  draftKey?: string;
  onSubmit: (values: ChapterFormState) => void;
  onClose: () => void;
}) {
  const [draft] = useState(() => (draftKey ? loadChapterDraft(draftKey) : null));
  const [hasDraft, setHasDraft] = useState(() => Boolean(draft?.title || draft?.content));
  const [form, setForm] = useState<ChapterFormState>({ ...initial, ...draft });

  useEffect(() => {
    if (!draftKey) return;
    if (form.title || form.content) saveChapterDraft(draftKey, form);
  }, [draftKey, form]);

  // Verrouille le scroll du body et ferme sur Échap — même comportement que
  // ChapterPanel.tsx (panel plein écran).
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  function set<K extends keyof ChapterFormState>(key: K, value: ChapterFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleRestart() {
    if (!window.confirm('Effacer le brouillon et recommencer ce chapitre depuis le début ?')) return;
    if (draftKey) clearChapterDraft(draftKey);
    setForm({ ...EMPTY_CHAPTER_FORM, chapterNumber: initial.chapterNumber });
    setHasDraft(false);
  }

  return (
    <>
      <div role="presentation" onClick={onClose} className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[3px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-0 z-[91] flex flex-col bg-white text-neutral-900 shadow-[0_20px_60px_rgb(0_0_0/35%)] sm:inset-x-auto sm:inset-y-4 sm:left-1/2 sm:w-full sm:max-w-3xl sm:-translate-x-1/2 sm:rounded-3xl sm:border sm:border-black/10 dark:bg-neutral-900 dark:text-neutral-100 dark:sm:border-white/10"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <h2 className="m-0 text-[1.05rem]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-8 items-center justify-center rounded-full border-none bg-none text-[1.3rem] leading-none opacity-60 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {hasDraft && (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-brand-amber bg-brand-amber/10 px-4 py-3 text-[0.85rem]">
              <span>Brouillon restauré automatiquement.</span>
              <button type="button" onClick={handleRestart} className="border-none bg-none text-[0.8rem] text-rose-600 underline">
                Recommencer
              </button>
            </div>
          )}

          <form
            className={bookFormClass}
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form);
            }}
          >
            <div className={rowClass}>
              <label className={fieldClass}>
                Titre du chapitre
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  maxLength={255}
                  required
                  className={inputClass}
                />
              </label>
              <label className={`${fieldClass} max-w-56`}>
                N° du chapitre
                <input
                  type="number"
                  min={1}
                  value={form.chapterNumber}
                  onChange={(e) => set('chapterNumber', Number(e.target.value))}
                  required
                  className={inputClass}
                />
              </label>
            </div>

            <label className={fieldClass}>
              Introduction (facultative)
              <textarea value={form.introduction} onChange={(e) => set('introduction', e.target.value)} rows={2} className={`${inputClass} resize-y`} />
            </label>

            <label className={fieldClass}>
              Contenu
              <RichTextEditor content={form.content} onChange={(html) => set('content', html)} />
            </label>

            {error && <p className={errorClass}>{error}</p>}

            <div className={bookFormActionsClass}>
              <button type="submit" disabled={isSubmitting} className={btnPrimaryClass}>
                {isSubmitting ? 'Enregistrement…' : submitLabel}
              </button>
              <button type="button" onClick={onClose} disabled={isSubmitting} className={btnClass}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

type ChapterMode = { type: 'idle' } | { type: 'create' } | { type: 'edit'; id: number };

function ChaptersManager({ bookId, chapters, parts, onChanged }: { bookId: number; chapters: ChapterSummary[]; parts: BookPart[]; onChanged: () => void }) {
  const [mode, setMode] = useState<ChapterMode>({ type: 'idle' });
  const [editingInitial, setEditingInitial] = useState<ChapterFormState | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<ChapterSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const sortedChapters = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const draftKey = `author-chapter-draft-${bookId}`;

  function openCreate() {
    setFormError(null);
    setMode({ type: 'create' });
  }

  async function openEdit(chapterId: number) {
    setFormError(null);
    setMode({ type: 'edit', id: chapterId });
    setIsLoadingEdit(true);
    try {
      const res = await apiClient.get(`/chapters/manage/${chapterId}`);
      const chapter = res.data?.data;
      setEditingInitial({
        title: chapter?.title ?? '',
        chapterNumber: chapter?.chapterNumber ?? 1,
        content: chapter?.content ?? '',
        introduction: chapter?.extension?.introduction ?? '',
      });
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Impossible de charger ce chapitre.'));
    } finally {
      setIsLoadingEdit(false);
    }
  }

  async function handleSubmit(values: ChapterFormState) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (mode.type === 'create') {
        await apiClient.post('/chapters', { ...chapterPayload(values), bookId });
        clearChapterDraft(draftKey);
      } else if (mode.type === 'edit') {
        await apiClient.patch(`/chapters/${mode.id}`, chapterPayload(values));
      }
      setMode({ type: 'idle' });
      onChanged();
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Impossible d\'enregistrer le chapitre.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssignPart(chapterId: number, partId: number | null) {
    setAssigningId(chapterId);
    try {
      await apiClient.patch(`/chapters/${chapterId}`, { partId });
      onChanged();
    } catch {
      // Silencieux : la sélection reprend sa valeur au prochain fetch via onChanged().
    } finally {
      setAssigningId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!chapterToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/chapters/${chapterToDelete.id}`);
      setChapterToDelete(null);
      onChanged();
    } catch (err) {
      setDeleteError(extractApiErrorMessage(err, 'La suppression a échoué.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className={panelClass}>
      <div className={panelHeadClass}>
        <h2 className="m-0 text-[1.1rem]">Chapitres ({chapters.length})</h2>
        <button type="button" onClick={openCreate} className={btnPrimaryClass}>
          + Nouveau chapitre
        </button>
      </div>

      {sortedChapters.length === 0 ? (
        <p className="opacity-60">Aucun chapitre pour l'instant.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {sortedChapters.map((chapter) => (
            <li key={chapter.id} className="flex items-center gap-3 rounded-xl border border-black/10 px-3.5 py-2.5 dark:border-white/10">
              <span className="min-w-0 flex-1 overflow-hidden text-[0.875rem] text-ellipsis whitespace-nowrap">
                <span className="text-[0.7rem] opacity-55">Ch. {chapter.chapterNumber} · </span>
                {chapter.title}
              </span>
              <select
                value={chapter.partId ?? ''}
                onChange={(e) => handleAssignPart(chapter.id, e.target.value ? Number(e.target.value) : null)}
                disabled={assigningId === chapter.id}
                aria-label={`Partie du chapitre ${chapter.title}`}
                className="max-w-32 shrink-0 rounded border border-black/10 bg-white px-2 py-1.5 text-xs text-neutral-900 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="">Sans partie</option>
                {parts.map((part) => (
                  <option key={part.id} value={part.id}>
                    P. {part.partNumber}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => openEdit(chapter.id)} aria-label="Modifier le chapitre" className={iconBtnClass}>
                ✎
              </button>
              <button type="button" onClick={() => setChapterToDelete(chapter)} aria-label="Supprimer le chapitre" className={iconBtnClass}>
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}

      {mode.type === 'create' && (
        <ChapterEditor
          title="Nouveau chapitre"
          initial={{ ...EMPTY_CHAPTER_FORM, chapterNumber: sortedChapters.length + 1 }}
          isSubmitting={isSubmitting}
          error={formError}
          submitLabel="Créer le chapitre"
          draftKey={draftKey}
          onSubmit={handleSubmit}
          onClose={() => setMode({ type: 'idle' })}
        />
      )}

      {mode.type === 'edit' && !isLoadingEdit && editingInitial && (
        <ChapterEditor
          title={`Chapitre ${editingInitial.chapterNumber} · ${editingInitial.title}`}
          initial={editingInitial}
          isSubmitting={isSubmitting}
          error={formError}
          submitLabel="Enregistrer le chapitre"
          onSubmit={handleSubmit}
          onClose={() => setMode({ type: 'idle' })}
        />
      )}

      {chapterToDelete && (
        <DeleteConfirm
          title="Supprimer ce chapitre ?"
          description={`Le chapitre ${chapterToDelete.chapterNumber} · « ${chapterToDelete.title} » sera définitivement retiré du livre.`}
          isSubmitting={isDeleting}
          error={deleteError}
          onClose={() => {
            setChapterToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
}

// --- Dashboard principal ---------------------------------------------------

// Équivalent de src/components/dashboard/author/BookManageDashboard.tsx.
// L'édition EPUB (EpubEditionsPanel.tsx côté source) n'est pas portée ici —
// génération/téléchargement de fichier asynchrone, hors scope de ce
// scaffold (cf. README).
export default function BookManageDashboard({ bookId }: { bookId: string }) {
  const user = useRequireAuth(`/espace-auteur/livres/${bookId}`);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<BookFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function loadBook() {
    apiClient
      .get(`/books/manage/${bookId}`)
      .then((res) => setBook(res.data?.data ?? null))
      .catch((err) => setLoadError(extractApiErrorMessage(err, 'Impossible de charger ce livre.')));
  }

  useEffect(() => {
    if (user) loadBook();
  }, [user, bookId]);

  useEffect(() => {
    if (!user) return;
    apiClient
      .get('/categories')
      .then((res) => setCategories(res.data?.data ?? []))
      .catch(() => setCategories([]));
  }, [user]);

  function startEdit() {
    if (!book) return;
    setEditForm(bookToFormState(book));
    setSaveError(null);
    setIsEditing(true);
  }

  function setField<K extends keyof BookFormState>(key: K, value: BookFormState[K]) {
    setEditForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!editForm) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await apiClient.patch(`/books/${bookId}`, toBookApiPayload(editForm));
      setBook(res.data?.data ?? null);
      setIsEditing(false);
    } catch (err) {
      setSaveError(extractApiErrorMessage(err, "Impossible d'enregistrer les modifications"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/books/${bookId}`, { data: { confirmationPhrase: CONFIRMATION_PHRASE } });
      window.location.href = '/espace-auteur/livres';
    } catch (err) {
      setDeleteError(extractApiErrorMessage(err, 'La suppression a échoué.'));
      setIsDeleting(false);
    }
  }

  if (!user) return null;
  if (loadError) return <p className={errorClass}>{loadError}</p>;
  if (book === null) return <p className="opacity-60">Chargement…</p>;

  return (
    <div className="flex flex-col gap-6">
      <a href="/espace-auteur/livres" className="w-fit text-[0.85rem] no-underline opacity-70">
        ← Retour à mes livres
      </a>

      <section className={panelClass}>
        <div className="flex gap-5">
          {book.cover && <img src={book.cover} alt="" className="h-36 w-24 shrink-0 rounded-lg object-cover" />}
          <div>
            <h1 className="m-0 text-[1.3rem]">{book.title}</h1>
            <p className="text-[0.7rem] opacity-55">{book.category.name}</p>
            <p className="my-2 max-w-2xl text-[0.85rem] opacity-75">{book.resume}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className={badgeClass}>
                {book.chapters.length} chapitre{book.chapters.length > 1 ? 's' : ''}
              </span>
              <span className={badgeClass}>{book.isFree ? 'Gratuit' : `${formatPrice(book.price)} FCFA`}</span>
              {book.isPromotion && <span className={badgeFreeClass}>Promo</span>}
            </div>
            <div className={`${bookFormActionsClass} mt-3`}>
              <button type="button" onClick={startEdit} className={btnPrimaryClass}>
                Modifier
              </button>
              <button type="button" onClick={() => setIsDeleteOpen(true)} className={btnDangerClass}>
                Supprimer
              </button>
              <a href={`/livres/${book.slug}`} className={`${btnClass} no-underline`}>
                Voir la fiche
              </a>
            </div>
          </div>
        </div>
      </section>

      {isEditing && editForm && (
        <section className={panelClass}>
          <h2 className="m-0 text-[1.1rem]">Modifier le livre</h2>
          <form className={`${bookFormClass} mt-4`} onSubmit={handleSave}>
            <BookFormFields form={editForm} set={setField} categories={categories} />
            {saveError && <p className={errorClass}>{saveError}</p>}
            <div className={bookFormActionsClass}>
              <button type="submit" disabled={isSaving} className={btnPrimaryClass}>
                {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className={btnClass}>
                Annuler
              </button>
            </div>
          </form>
        </section>
      )}

      <PartsManager bookId={book.id} parts={book.parts} onChanged={loadBook} />

      <GrantPanel bookId={book.id} bookTitle={book.title} />

      <ChaptersManager bookId={book.id} chapters={book.chapters} parts={book.parts} onChanged={loadBook} />

      {isDeleteOpen && (
        <DeleteConfirm
          title="Supprimer ce livre ?"
          description={`Vous êtes sur le point de retirer « ${book.title} »${
            book.chapters.length > 0 ? ` et ses ${book.chapters.length} chapitre${book.chapters.length > 1 ? 's' : ''}` : ''
          }. Cette action est irréversible.`}
          isSubmitting={isDeleting}
          error={deleteError}
          onClose={() => {
            setIsDeleteOpen(false);
            setDeleteError(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
