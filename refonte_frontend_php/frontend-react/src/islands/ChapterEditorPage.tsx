import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Hash, Layers, Save, Trash2, FileText, Sparkles, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { RichTextEditor } from '../components/RichTextEditor';
import { DeleteConfirm } from '../components/DeleteConfirm';
import { glassPanel, glassInset, inputBase, labelBase, btnPrimary, btnSecondary, btnGhost, btnDanger, errorText, skeletonPulse } from '../lib/authorUi';

interface Props {
  bookId: string;
  // Absent = création. Présent = édition de ce chapitre.
  chapterId?: string;
}

interface BookPart {
  id: number;
  title: string;
  partNumber: number;
}

interface BookSummary {
  id: number;
  title: string;
  parts: BookPart[];
  chapters: Array<{ id: number; chapterNumber: number }>;
}

interface ChapterFormState {
  title: string;
  chapterNumber: number;
  introduction: string;
  content: string;
  partId: number | null;
}

const EMPTY_FORM: ChapterFormState = { title: '', chapterNumber: 1, introduction: '', content: '', partId: null };

function chapterPayload(form: ChapterFormState) {
  return {
    title: form.title,
    chapterNumber: form.chapterNumber,
    content: form.content,
    partId: form.partId,
    extension: form.introduction ? { introduction: form.introduction } : undefined,
  };
}

// Brouillon localStorage — uniquement pour la création (pas l'édition, où
// les données serveur font déjà foi), même règle que ChapterForm.tsx côté source.
function draftKeyFor(bookId: string): string {
  return `author-chapter-draft-${bookId}`;
}

function loadDraft(key: string): Partial<ChapterFormState> | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(key: string, values: ChapterFormState) {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // stockage indisponible (navigation privée, quota) : on continue sans persistance
  }
}

function clearDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // rien à faire si l'accès au storage échoue déjà
  }
}

interface NarrationWord {
  word: string;
  start: number;
  end: number;
  // Position du mot dans `NarrationState.text` — permet de surligner sur le
  // texte source tel quel (tirets de dialogue, sauts de ligne d'origine)
  // plutôt que de le reconstruire en concaténant les mots avec des espaces.
  // Absents sur une narration générée avant cet ajout côté API TTS.
  charStart?: number | null;
  charEnd?: number | null;
}

interface NarrationState {
  status: 'none' | 'pending' | 'processing' | 'done' | 'error' | 'cancelled';
  // Étape en cours côté service TTS (ex. "synthese_audio (2/5)",
  // "alignement_mots") — transitoire, présent seulement pendant pending/processing.
  progress: string | null;
  // Temps restant estimé (secondes) — absent tant que le service TTS n'a pas
  // assez d'historique pour calibrer une estimation (dès le 2e job).
  etaSeconds: number | null;
  voice: string | null;
  dialogueVoice: string | null;
  speed: number | null;
  audioUrl: string | null;
  text: string | null;
  words: NarrationWord[] | null;
  errorMessage: string | null;
  updatedAt: string | null;
}

// Découpe `text` (préservé tel quel par l'API TTS — tirets de dialogue,
// sauts de ligne d'origine) en segments autour de charStart/charEnd de
// chaque mot, pour surligner le mot en cours sans reconstruire le texte à
// partir des seuls tokens (perdrait la ponctuation/mise en forme d'origine).
// Sans texte source (narration générée avant l'ajout de `text` côté API
// TTS), on retombe entièrement sur la concaténation des tokens. Avec texte
// source, l'alignement peut malgré tout échouer mot par mot côté WhisperX
// (transcription divergente) : charStart/charEnd valent alors null pour CE
// mot seulement — on ne l'insère juste pas, son texte apparaît quand même
// (non surligné) via le flush du prochain mot positionné.
function renderKaraokeText(text: string | null, words: NarrationWord[], currentWordIndex: number) {
  const highlightClass = 'rounded bg-gradient-to-br from-brand-amber to-brand-pink px-0.5 text-neutral-950';

  if (text === null) {
    return words.map((w, i) => (
      <span key={i} className={i === currentWordIndex ? highlightClass : undefined}>
        {w.word}{' '}
      </span>
    ));
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  words.forEach((w, i) => {
    const hasOffsets = typeof w.charStart === 'number' && typeof w.charEnd === 'number';
    if (hasOffsets) {
      const start = w.charStart as number;
      const end = w.charEnd as number;
      if (start > cursor) nodes.push(text.slice(cursor, start));
      nodes.push(
        <span key={i} className={i === currentWordIndex ? highlightClass : undefined}>
          {text.slice(start, end)}
        </span>,
      );
      cursor = end;
    }
    // Sans position, on ne peut pas surligner ce mot précisément : on le
    // laisse au texte source environnant (flush par le prochain mot
    // positionné, ou en fin de boucle) plutôt que d'insérer son propre token
    // en double à côté du texte source qui le contient déjà.
  });

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

// Traduit le code d'étape brut renvoyé par le service TTS (cf. son OpenAPI,
// champ StatusResponse.progress) en libellé lisible pour l'auteur.
const PROGRESS_LABELS: Record<string, string> = {
  synthese_audio: 'Synthèse audio…',
  chargement_modele_whisper: 'Chargement du modèle de reconnaissance vocale…',
  transcription: "Transcription de l'audio…",
  chargement_modele_alignement: "Chargement du modèle d'alignement…",
  alignement_mots: 'Alignement des mots…',
};

function describeNarrationProgress(progress: string | null): string {
  if (progress === null) return 'Génération en cours…';
  const synthesisMatch = progress.match(/^synthese_audio \((\d+)\/(\d+)\)$/);
  if (synthesisMatch) return `Synthèse audio (${synthesisMatch[1]}/${synthesisMatch[2]})…`;
  return PROGRESS_LABELS[progress] ?? 'Génération en cours…';
}

// Absent tant que le service TTS n'a pas assez d'historique pour estimer
// (cf. StatusResponse.eta_seconds) — approximatif par nature.
function formatEtaSeconds(etaSeconds: number | null): string | null {
  if (etaSeconds === null || etaSeconds < 0) return null;
  if (etaSeconds < 60) return `~${Math.max(1, Math.round(etaSeconds))} s restantes`;
  return `~${Math.round(etaSeconds / 60)} min restantes`;
}

function wordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').trim();
  return text ? text.split(/\s+/).length : 0;
}

// Équivalent immersif du panel ChapterForm.tsx — page dédiée plutôt que
// modale (l'ancienne modale, cf. git history de BookManageDashboard.tsx,
// posait aussi un problème de containing block avec les panneaux
// backdrop-blur). Layout studio : contenu éditorial au centre, réglages du
// chapitre dans une colonne fixe à droite.
export default function ChapterEditorPage({ bookId, chapterId }: Props) {
  const isEditMode = chapterId !== undefined;
  const user = useRequireAuth(isEditMode ? `/espace-auteur/livres/${bookId}/chapitres/${chapterId}` : `/espace-auteur/livres/${bookId}/chapitres/nouveau`);

  const [book, setBook] = useState<BookSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<ChapterFormState>(EMPTY_FORM);
  const [isLoadingChapter, setIsLoadingChapter] = useState(isEditMode);
  const [hasDraft, setHasDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [narration, setNarration] = useState<NarrationState | null>(null);
  const [isStartingNarration, setIsStartingNarration] = useState(false);
  const [isCancellingNarration, setIsCancellingNarration] = useState(false);
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Livre (titre pour le fil d'ariane + parties disponibles pour l'assignation).
  useEffect(() => {
    if (!user) return;
    apiClient
      .get(`/books/manage/${bookId}`)
      .then((res) => setBook(res.data?.data ?? null))
      .catch((err) => setLoadError(extractApiErrorMessage(err, 'Impossible de charger ce livre.')));
  }, [user, bookId]);

  // Création : brouillon localStorage + numéro de chapitre par défaut une
  // fois le livre chargé (nombre de chapitres existants + 1).
  useEffect(() => {
    if (isEditMode || !book) return;
    const key = draftKeyFor(bookId);
    const draft = loadDraft(key);
    setHasDraft(Boolean(draft?.title || draft?.content));
    setForm({ ...EMPTY_FORM, chapterNumber: book.chapters.length + 1, ...draft });
  }, [isEditMode, book, bookId]);

  // Édition : charge le chapitre existant.
  useEffect(() => {
    if (!isEditMode || !chapterId || !user) return;
    setIsLoadingChapter(true);
    apiClient
      .get(`/chapters/manage/${chapterId}`)
      .then((res) => {
        const chapter = res.data?.data;
        setForm({
          title: chapter?.title ?? '',
          chapterNumber: chapter?.chapterNumber ?? 1,
          introduction: chapter?.extension?.introduction ?? '',
          content: chapter?.content ?? '',
          partId: chapter?.partId ?? null,
        });
      })
      .catch((err) => setLoadError(extractApiErrorMessage(err, 'Impossible de charger ce chapitre.')))
      .finally(() => setIsLoadingChapter(false));
  }, [isEditMode, chapterId, user]);

  // Sauvegarde automatique du brouillon (création uniquement).
  useEffect(() => {
    if (isEditMode) return;
    if (form.title || form.content) saveDraft(draftKeyFor(bookId), form);
  }, [isEditMode, bookId, form]);

  // Narration audio : uniquement en édition (il faut un chapterId existant
  // côté API TTS pour rattacher le job). État initial au montage.
  useEffect(() => {
    if (!isEditMode || !chapterId || !user) return;
    let cancelled = false;
    apiClient
      .get(`/chapters/${chapterId}/narration`)
      .then((res) => {
        if (!cancelled) setNarration(res.data?.data ?? null);
      })
      .catch(() => {
        // Silencieux : l'absence de narration ne doit jamais casser l'édition du chapitre.
      });
    return () => {
      cancelled = true;
    };
  }, [isEditMode, chapterId, user]);

  // Poll tant que le job est en cours côté service TTS (pending/processing) —
  // se ré-arme à chaque changement de `narration` et se coupe dès que l'état
  // n'est plus transitoire, cf. cleanup ci-dessous. `ignore` couvre aussi la
  // requête déjà en vol (pas seulement le timer) : sur un chapitre long,
  // annuler pendant qu'un poll est en cours de résolution faisait sinon
  // écraser l'état "cancelled" tout juste posé par le résultat pending/
  // processing périmé de ce poll, relançant le cycle indéfiniment.
  useEffect(() => {
    if (!isEditMode || !chapterId) return;
    if (narration?.status !== 'pending' && narration?.status !== 'processing') return;

    let ignore = false;
    const timer = window.setTimeout(() => {
      apiClient
        .get(`/chapters/${chapterId}/narration`)
        .then((res) => {
          if (!ignore) setNarration(res.data?.data ?? null);
        })
        .catch(() => {});
    }, 3000);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [isEditMode, chapterId, narration]);

  if (!user) return null;

  async function handleGenerateNarration() {
    if (!chapterId) return;
    setIsStartingNarration(true);
    setNarrationError(null);
    try {
      const res = await apiClient.post(`/chapters/${chapterId}/narration`, {});
      setNarration(res.data?.data ?? null);
      setCurrentWordIndex(-1);
    } catch (err) {
      setNarrationError(extractApiErrorMessage(err, "Impossible de lancer la génération audio."));
    } finally {
      setIsStartingNarration(false);
    }
  }

  async function handleCancelNarration() {
    if (!chapterId) return;
    setIsCancellingNarration(true);
    try {
      const res = await apiClient.post(`/chapters/${chapterId}/narration/cancel`, {});
      setNarration(res.data?.data ?? null);
    } catch (err) {
      setNarrationError(extractApiErrorMessage(err, "Impossible d'annuler la génération."));
    } finally {
      setIsCancellingNarration(false);
    }
  }

  function handleAudioTimeUpdate() {
    const audio = audioRef.current;
    const words = narration?.words;
    if (!audio || !words || words.length === 0) return;
    const t = audio.currentTime;
    setCurrentWordIndex((prev) => {
      let i = prev >= 0 ? prev : 0;
      while (i < words.length - 1 && words[i + 1].start <= t) i++;
      while (i > 0 && words[i].start > t) i--;
      return i;
    });
  }

  function set<K extends keyof ChapterFormState>(key: K, value: ChapterFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleRestart() {
    if (!window.confirm('Effacer le brouillon et recommencer ce chapitre depuis le début ?')) return;
    clearDraft(draftKeyFor(bookId));
    setForm({ ...EMPTY_FORM, chapterNumber: book?.chapters.length ? book.chapters.length + 1 : 1 });
    setHasDraft(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await apiClient.patch(`/chapters/${chapterId}`, chapterPayload(form));
      } else {
        await apiClient.post('/chapters', { ...chapterPayload(form), bookId: Number(bookId) });
        clearDraft(draftKeyFor(bookId));
      }
      window.location.href = `/espace-auteur/livres/${bookId}`;
    } catch (err) {
      setSubmitError(extractApiErrorMessage(err, "Impossible d'enregistrer le chapitre."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!chapterId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/chapters/${chapterId}`);
      window.location.href = `/espace-auteur/livres/${bookId}`;
    } catch (err) {
      setDeleteError(extractApiErrorMessage(err, 'La suppression a échoué.'));
      setIsDeleting(false);
    }
  }

  if (loadError) return <p className={errorText}>{loadError}</p>;
  if (book === null || isLoadingChapter) return <div className={`${skeletonPulse} h-96`} />;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <a
          href={`/espace-auteur/livres/${bookId}`}
          className="inline-flex w-fit items-center gap-1.5 text-[0.85rem] text-white/50 no-underline hover:text-white"
        >
          <ArrowLeft size={14} /> Retour à « {book.title} »
        </a>

        <div className="mt-4 mb-6 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber/20 to-brand-pink/20 text-brand-amber">
            <FileText size={19} />
          </span>
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-white/40 uppercase">
              {isEditMode ? 'Modifier le chapitre' : 'Nouveau chapitre'}
            </p>
            <h1 className="text-xl font-bold text-white sm:text-2xl">{form.title || 'Sans titre'}</h1>
          </div>
        </div>

        {hasDraft && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-amber/25 bg-brand-amber/10 px-4.5 py-3.5 text-[0.85rem] text-brand-amber">
            <span>Brouillon restauré — reprenez là où vous vous étiez arrêté·e.</span>
            <button type="button" onClick={handleRestart} className="text-[0.8rem] text-rose-300 underline">
              Recommencer
            </button>
          </div>
        )}

        <form id="chapter-form" onSubmit={handleSubmit} className={`${glassPanel} flex flex-col gap-5 p-6 sm:p-7`}>
          <label className={labelBase}>
            Titre du chapitre
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={255}
              required
              placeholder="Le titre de ce chapitre…"
              className={`${inputBase} text-base font-medium`}
            />
          </label>

          <label className={labelBase}>
            Introduction (facultative)
            <textarea
              value={form.introduction}
              onChange={(e) => set('introduction', e.target.value)}
              rows={2}
              placeholder="Un court avant-propos affiché avant le chapitre…"
              className={`${inputBase} resize-y`}
            />
          </label>

          <div className={labelBase}>
            {/* <div>, pas <label> : le RichTextEditor contient ses propres
                <button> (barre d'outils) — un <label> englobant leur
                transférerait automatiquement tout clic dans l'éditeur (y
                compris le texte, pas juste la barre d'outils) vers le
                premier bouton labelable qu'il trouve (ici "Gras"), l'activant
                à chaque clic dans le contenu. Cf. spec HTML sur le "label's
                control" : un <label> sans `for` cible le premier descendant
                labelable en ordre du document. */}
            Contenu
            <RichTextEditor content={form.content} onChange={(html) => set('content', html)} />
          </div>

          {submitError && <p className={errorText}>{submitError}</p>}
        </form>

        {isEditMode && (
          <div className={`${glassPanel} mt-6 p-6 sm:p-7`}>
            <div className="mb-4 flex items-center gap-2">
              <Volume2 size={15} className="text-brand-amber" />
              <h2 className="text-[0.9rem] font-semibold text-white">Narration audio</h2>
            </div>

            {(narration === null || narration.status === 'none') && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[0.85rem] text-white/50">Générez une version audio narrée de ce chapitre, avec surlignage mot à mot.</p>
                <button type="button" onClick={handleGenerateNarration} disabled={isStartingNarration} className={btnSecondary}>
                  {isStartingNarration ? <Loader2 size={15} className="animate-spin" /> : <Volume2 size={15} />}
                  {isStartingNarration ? 'Lancement…' : "Générer l'audio"}
                </button>
              </div>
            )}

            {narration && (narration.status === 'pending' || narration.status === 'processing') && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-[0.85rem] text-white/60">
                  <Loader2 size={15} className="animate-spin text-brand-amber" />
                  {describeNarrationProgress(narration.progress)}
                  {formatEtaSeconds(narration.etaSeconds) && (
                    <span className="text-white/35">· {formatEtaSeconds(narration.etaSeconds)}</span>
                  )}
                </span>
                <button type="button" onClick={handleCancelNarration} disabled={isCancellingNarration} className={btnGhost}>
                  {isCancellingNarration ? <Loader2 size={14} className="animate-spin" /> : 'Annuler'}
                </button>
              </div>
            )}

            {narration && narration.status === 'cancelled' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[0.85rem] text-white/50">Génération annulée.</p>
                <button type="button" onClick={handleGenerateNarration} disabled={isStartingNarration} className={btnSecondary}>
                  {isStartingNarration ? <Loader2 size={15} className="animate-spin" /> : <Volume2 size={15} />}
                  {isStartingNarration ? 'Lancement…' : 'Relancer'}
                </button>
              </div>
            )}

            {narration && narration.status === 'error' && (
              <div className="flex flex-col gap-3">
                <p className={`${errorText} flex items-center gap-1.5`}>
                  <AlertCircle size={14} /> {narration.errorMessage ?? "La génération audio a échoué."}
                </p>
                <button type="button" onClick={handleGenerateNarration} disabled={isStartingNarration} className={`${btnSecondary} w-fit`}>
                  Réessayer
                </button>
              </div>
            )}

            {narration && narration.status === 'done' && narration.audioUrl && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <audio
                    ref={audioRef}
                    src={narration.audioUrl}
                    controls
                    onTimeUpdate={handleAudioTimeUpdate}
                    className="h-10 min-w-0 flex-1"
                  />
                  <button type="button" onClick={handleGenerateNarration} disabled={isStartingNarration} className={btnGhost}>
                    {isStartingNarration ? <Loader2 size={14} className="animate-spin" /> : 'Régénérer'}
                  </button>
                </div>

                {narration.words && narration.words.length > 0 && (
                  <div className={`${glassInset} max-h-64 overflow-y-auto p-4 text-[0.9rem] leading-[1.9] whitespace-pre-wrap text-white/60`}>
                    {renderKaraokeText(narration.text, narration.words, currentWordIndex)}
                  </div>
                )}
              </div>
            )}

            {narrationError && <p className={`${errorText} mt-3`}>{narrationError}</p>}
          </div>
        )}
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-6 lg:w-80">
        <div className={`${glassPanel} p-5`}>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={15} className="text-brand-amber" />
            <h2 className="text-[0.9rem] font-semibold text-white">Réglages du chapitre</h2>
          </div>

          <div className="flex flex-col gap-4">
            <label className={labelBase}>
              <span className="flex items-center gap-1.5">
                <Hash size={13} /> Numéro du chapitre
              </span>
              <input
                type="number"
                min={1}
                value={form.chapterNumber}
                onChange={(e) => set('chapterNumber', Number(e.target.value))}
                required
                className={inputBase}
              />
            </label>

            <label className={labelBase}>
              <span className="flex items-center gap-1.5">
                <Layers size={13} /> Partie associée
              </span>
              <select
                value={form.partId ?? ''}
                onChange={(e) => set('partId', e.target.value ? Number(e.target.value) : null)}
                className={inputBase}
              >
                <option value="" className="bg-neutral-900">
                  Aucune (chapitre libre)
                </option>
                {book.parts.map((part) => (
                  <option key={part.id} value={part.id} className="bg-neutral-900">
                    Partie {part.partNumber} · {part.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={`mt-4 ${glassInset} flex items-center justify-between px-3.5 py-2.5`}>
            <span className="flex items-center gap-1.5 text-[0.75rem] text-white/45">
              <BookOpen size={13} /> Mots
            </span>
            <span className="text-sm font-semibold text-white">{wordCount(form.content).toLocaleString('fr-FR')}</span>
          </div>
        </div>

        <div className={`${glassPanel} flex flex-col gap-2.5 p-5`}>
          <button type="submit" form="chapter-form" disabled={isSubmitting} className={`${btnPrimary} w-full`}>
            <Save size={15} /> {isSubmitting ? 'Enregistrement…' : isEditMode ? 'Enregistrer' : 'Créer le chapitre'}
          </button>
          <a href={`/espace-auteur/livres/${bookId}`} className={`${btnSecondary} w-full no-underline`}>
            Annuler
          </a>
          {isEditMode && (
            <button type="button" onClick={() => setIsDeleteOpen(true)} className={`${btnDanger} mt-1 w-full`}>
              <Trash2 size={15} /> Supprimer ce chapitre
            </button>
          )}
        </div>
      </aside>

      {isDeleteOpen && (
        <DeleteConfirm
          title="Supprimer ce chapitre ?"
          description={`Le chapitre ${form.chapterNumber} · « ${form.title} » sera définitivement retiré du livre.`}
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
