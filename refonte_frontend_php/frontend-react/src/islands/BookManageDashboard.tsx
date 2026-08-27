import { useEffect, useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
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
    <section className="dashboard-panel">
      <div className="manage-panel__head">
        <div>
          <h2>Parties à vendre</h2>
          <p className="dashboard-panel__description">Chaque partie est achetée séparément et peut contenir plusieurs chapitres.</p>
        </div>
        <span className="badge">
          {parts.length} partie{parts.length > 1 ? 's' : ''}
        </span>
      </div>

      <form className="manage-inline-form" onSubmit={handleCreate}>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la partie" />
        <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} disabled={isFree} placeholder="Prix FCFA" />
        <label>
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Partie gratuite
        </label>
        <input type="number" min={0} value={freeChapterCount} onChange={(e) => setFreeChapterCount(Number(e.target.value))} placeholder="Chapitres gratuits" />
        <button type="submit" className="btn btn--primary" disabled={isCreating || !title.trim()}>
          {isCreating ? 'Création…' : 'Ajouter une partie'}
        </button>
      </form>
      {error && <p className="review-form__error">{error}</p>}

      {parts.length === 0 ? (
        <p className="empty">Ajoutez une partie pour proposer une vente par section.</p>
      ) : (
        <ul className="manage-list">
          {parts.map((part) => (
            <li key={part.id}>
              <span className="manage-list__number">{part.partNumber}</span>
              <span className="dashboard-book__info">
                <span className="dashboard-book__title">{part.title}</span>
                <span className="dashboard-book__meta">
                  {part.chapters.length} chapitre{part.chapters.length > 1 ? 's' : ''} · {part.isFree ? 'Gratuite' : `${formatPrice(part.price)} FCFA`}
                </span>
              </span>
              <button type="button" className="author-book-card__delete" onClick={() => handleDelete(part)} aria-label={`Supprimer ${part.title}`}>
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
    <section className="dashboard-panel">
      <h2>Offrir ce livre</h2>
      <p className="dashboard-panel__description">Accordez l'accès complet à « {bookTitle} » à un lecteur.</p>
      <form className="admin-grant-form" onSubmit={handleSubmit}>
        <label>
          E-mail du lecteur
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="admin-grant-form__note">
          Note interne (facultative)
          <input type="text" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting || !email.trim()}>
          {isSubmitting ? 'Attribution…' : 'Attribuer le livre'}
        </button>
      </form>
      {error && <p className="review-form__error">{error}</p>}
      {success && <p className="kyc-form__success">Livre attribué avec succès.</p>}
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
      <div className="chapter-panel-backdrop" role="presentation" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-label={title} className="chapter-panel">
        <div className="chapter-panel__head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="chapter-panel__close">
            ×
          </button>
        </div>

        <div className="chapter-panel__body">
        {hasDraft && (
          <div className="wizard__draft-banner">
            <span>Brouillon restauré automatiquement.</span>
            <button type="button" onClick={handleRestart}>
              Recommencer
            </button>
          </div>
        )}

        <form
          className="book-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="book-form__row">
            <label className="book-form__field">
              Titre du chapitre
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={255} required />
            </label>
            <label className="book-form__field book-form__field--narrow">
              N° du chapitre
              <input type="number" min={1} value={form.chapterNumber} onChange={(e) => set('chapterNumber', Number(e.target.value))} required />
            </label>
          </div>

          <label className="book-form__field">
            Introduction (facultative)
            <textarea value={form.introduction} onChange={(e) => set('introduction', e.target.value)} rows={2} />
          </label>

          <label className="book-form__field">
            Contenu
            <RichTextEditor content={form.content} onChange={(html) => set('content', html)} />
          </label>

          {error && <p className="review-form__error">{error}</p>}

          <div className="book-form__actions">
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : submitLabel}
            </button>
            <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>
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
    <section className="dashboard-panel">
      <div className="manage-panel__head">
        <h2>Chapitres ({chapters.length})</h2>
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + Nouveau chapitre
        </button>
      </div>

      {sortedChapters.length === 0 ? (
        <p className="empty">Aucun chapitre pour l'instant.</p>
      ) : (
        <ul className="manage-list">
          {sortedChapters.map((chapter) => (
            <li key={chapter.id}>
              <span className="manage-list__chapter-title">
                <span className="dashboard-book__meta">Ch. {chapter.chapterNumber} · </span>
                {chapter.title}
              </span>
              <select
                value={chapter.partId ?? ''}
                onChange={(e) => handleAssignPart(chapter.id, e.target.value ? Number(e.target.value) : null)}
                disabled={assigningId === chapter.id}
                aria-label={`Partie du chapitre ${chapter.title}`}
              >
                <option value="">Sans partie</option>
                {parts.map((part) => (
                  <option key={part.id} value={part.id}>
                    P. {part.partNumber}
                  </option>
                ))}
              </select>
              <button type="button" className="author-book-card__delete" onClick={() => openEdit(chapter.id)} aria-label="Modifier le chapitre">
                ✎
              </button>
              <button type="button" className="author-book-card__delete" onClick={() => setChapterToDelete(chapter)} aria-label="Supprimer le chapitre">
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

  useEffect(loadBook, [bookId]);

  useEffect(() => {
    apiClient
      .get('/categories')
      .then((res) => setCategories(res.data?.data ?? []))
      .catch(() => setCategories([]));
  }, []);

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

  if (loadError) return <p className="review-form__error">{loadError}</p>;
  if (book === null) return <p className="empty">Chargement…</p>;

  return (
    <div className="manage-dashboard">
      <a href="/espace-auteur/livres" className="manage-dashboard__back">
        ← Retour à mes livres
      </a>

      <section className="dashboard-panel">
        <div className="manage-details">
          {book.cover && <img src={book.cover} alt="" className="manage-details__cover" />}
          <div className="manage-details__info">
            <h1>{book.title}</h1>
            <p className="dashboard-book__meta">{book.category.name}</p>
            <p className="manage-details__resume">{book.resume}</p>
            <div className="author-book-card__tags">
              <span className="badge">
                {book.chapters.length} chapitre{book.chapters.length > 1 ? 's' : ''}
              </span>
              <span className="badge">{book.isFree ? 'Gratuit' : `${formatPrice(book.price)} FCFA`}</span>
              {book.isPromotion && <span className="badge badge--free">Promo</span>}
            </div>
            <div className="book-form__actions">
              <button type="button" className="btn btn--primary" onClick={startEdit}>
                Modifier
              </button>
              <button type="button" className="btn btn--danger" onClick={() => setIsDeleteOpen(true)}>
                Supprimer
              </button>
              <a href={`/livres/${book.slug}`} className="btn">
                Voir la fiche
              </a>
            </div>
          </div>
        </div>
      </section>

      {isEditing && editForm && (
        <section className="dashboard-panel">
          <h2>Modifier le livre</h2>
          <form className="book-form" onSubmit={handleSave}>
            <BookFormFields form={editForm} set={setField} categories={categories} />
            {saveError && <p className="review-form__error">{saveError}</p>}
            <div className="book-form__actions">
              <button type="submit" className="btn btn--primary" disabled={isSaving}>
                {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
              <button type="button" className="btn" onClick={() => setIsEditing(false)} disabled={isSaving}>
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
