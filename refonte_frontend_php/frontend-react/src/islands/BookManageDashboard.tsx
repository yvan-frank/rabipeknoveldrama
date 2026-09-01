import { useEffect, useState, type FormEvent } from 'react';
import { Trash2, Pencil, ArrowLeft } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { formatPrice } from '../lib/formatPrice';
import { bookToFormState, toBookApiPayload, type BookFormState } from '../lib/bookForm';
import { BookFormFields } from '../components/BookFormFields';
import { Checkbox } from '../components/Checkbox';
import { DeleteConfirm, CONFIRMATION_PHRASE } from '../components/DeleteConfirm';
import { glassPanel, badgeNeutral, badgeAmber, btnPrimary, btnSecondary, btnDanger, inputBase, skeletonPulse, errorText } from '../lib/authorUi';

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

const panelClass = glassPanel + ' px-6 py-5';
const panelDescriptionClass = 'mt-1 mb-4 text-[0.8rem] text-white/50';
const panelHeadClass = 'mb-4 flex items-start justify-between gap-4';
const badgeClass = badgeNeutral;
const badgeFreeClass = badgeAmber;
const errorClass = errorText;
const btnClass = btnSecondary;
const btnPrimaryClass = btnPrimary;
const btnDangerClass = btnDanger;
const iconBtnClass = 'rounded-lg border-none bg-transparent p-1.5 text-white/35 transition hover:bg-white/[0.08] hover:text-white/80';
const bookFormClass = 'flex max-w-2xl flex-col gap-4';
const bookFormActionsClass = 'flex items-center gap-3';
const manageListInputClass = inputBase + ' py-2';

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
        <Checkbox checked={isFree} onChange={setIsFree} className="text-[0.85rem] text-white/80">
          Partie gratuite
        </Checkbox>
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
                <Trash2 size={15} />
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
// La création/édition du contenu d'un chapitre se fait désormais sur une
// page dédiée immersive (cf. ChapterEditorPage.tsx, /espace-auteur/livres/:id/chapitres/...)
// plutôt que dans une modale ici — ce panneau ne garde que la liste,
// l'assignation rapide à une partie, et la suppression.

function ChaptersManager({ bookId, chapters, parts, onChanged }: { bookId: number; chapters: ChapterSummary[]; parts: BookPart[]; onChanged: () => void }) {
  const [chapterToDelete, setChapterToDelete] = useState<ChapterSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const sortedChapters = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

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
        <a href={`/espace-auteur/livres/${bookId}/chapitres/nouveau`} className={`${btnPrimaryClass} no-underline`}>
          + Nouveau chapitre
        </a>
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
                className="max-w-32 shrink-0 rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-white"
              >
                <option value="" className="bg-neutral-900">
                  Sans partie
                </option>
                {parts.map((part) => (
                  <option key={part.id} value={part.id} className="bg-neutral-900">
                    P. {part.partNumber}
                  </option>
                ))}
              </select>
              <a href={`/espace-auteur/livres/${bookId}/chapitres/${chapter.id}`} aria-label="Modifier le chapitre" className={iconBtnClass}>
                <Pencil size={14} />
              </a>
              <button type="button" onClick={() => setChapterToDelete(chapter)} aria-label="Supprimer le chapitre" className={iconBtnClass}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
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
  if (book === null) return <div className={`${skeletonPulse} h-64`} />;

  return (
    <div className="flex flex-col gap-6">
      <a href="/espace-auteur/livres" className="inline-flex w-fit items-center gap-1.5 text-[0.85rem] text-white/50 no-underline hover:text-white">
        <ArrowLeft size={14} /> Retour à mes livres
      </a>

      <section className={panelClass}>
        <div className="flex gap-5">
          {book.cover && <img src={book.cover} alt="" className="h-36 w-24 shrink-0 rounded-lg object-cover shadow-lg" />}
          <div>
            <h1 className="text-[1.3rem] font-bold text-white">{book.title}</h1>
            <p className="text-[0.7rem] text-white/40">{book.category.name}</p>
            <p className="my-2 max-w-2xl text-[0.85rem] text-white/60">{book.resume}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className={badgeClass}>
                {book.chapters.length} chapitre{book.chapters.length > 1 ? 's' : ''}
              </span>
              <span className={badgeClass}>{book.isFree ? 'Gratuit' : `${formatPrice(book.price)} FCFA`}</span>
              {book.isPromotion && <span className={badgeFreeClass}>Promo</span>}
            </div>
            <div className={`${bookFormActionsClass} mt-3 flex-wrap`}>
              <button type="button" onClick={startEdit} className={`${btnPrimaryClass} shrink-0`}>
                Modifier
              </button>
              <button type="button" onClick={() => setIsDeleteOpen(true)} className={`${btnDangerClass} shrink-0`}>
                Supprimer
              </button>
              <a href={`/livres/${book.slug}`} className={`${btnClass} shrink-0 no-underline`}>
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

      <ChaptersManager bookId={book.id} chapters={book.chapters} parts={book.parts} onChanged={loadBook} />

      <PartsManager bookId={book.id} parts={book.parts} onChanged={loadBook} />

      <GrantPanel bookId={book.id} bookTitle={book.title} />

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
