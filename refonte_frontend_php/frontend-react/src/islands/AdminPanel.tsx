import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { apiClient, extractApiErrorMessage, getSessionUser, type SessionUser } from '../lib/apiClient';
import { formatPrice } from '../lib/formatPrice';
import { EditAccountModal, type EditableAccount } from '../components/EditAccountModal';

interface AdminData {
  revenue: number;
  counts: {
    users: number;
    authors: number;
    books: number;
    chapters: number;
    purchases: number;
    reviews: number;
    likes: number;
    shares: number;
    carts: number;
  };
  recentUsers: Array<{ id: number; name: string | null; email: string; isAdmin: boolean; isActive: boolean; createdAt: string }>;
  recentAuthors: Array<{ id: number; name: string | null; email: string; isAccountVerified: boolean; isKycVerified: boolean; createdAt: string }>;
  recentBooks: Array<{
    id: number;
    title: string;
    slug: string;
    cover: string | null;
    isFree: boolean;
    price: number;
    author: { name: string | null; email: string };
  }>;
}

interface BookGrant {
  id: number;
  date: string;
  note: string | null;
  user: { id: number; name: string | null; email: string };
  book: { id: number; title: string; slug: string; cover: string | null };
}

interface AdminUser {
  id: number;
  name: string | null;
  email: string;
  isActive: boolean;
}

interface GrantableBook {
  id: number;
  title: string;
  isFree: boolean;
  price: number;
}

type Sender = 'user' | 'admin';

interface SupportMessage {
  id: number;
  sender: Sender;
  content: string;
  createdAt: string;
}

interface ConversationSummary {
  userId: number;
  name: string | null;
  email: string;
  lastMessage: { content: string; createdAt: string; sender: Sender } | null;
  unreadCount: number;
}

interface ConversationDetail {
  user: { id: number; name: string | null; email: string };
  messages: SupportMessage[];
}

type Section = 'pilotage' | 'utilisateurs' | 'catalogue' | 'transactions' | 'book-grants' | 'moderation' | 'kyc' | 'support' | 'parametres';

const NAV_ITEMS: Array<{ id: Section; label: string }> = [
  { id: 'pilotage', label: 'Pilotage' },
  { id: 'utilisateurs', label: 'Utilisateurs' },
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'book-grants', label: 'Attribuer un livre' },
  { id: 'moderation', label: 'Modération' },
  { id: 'kyc', label: 'Vérification KYC' },
  { id: 'support', label: 'Support' },
  { id: 'parametres', label: 'Paramètres' },
];

function initial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

const panelClass = 'rounded-[1.25rem] border border-black/10 px-6 py-5 dark:border-white/10';
const panelDescriptionClass = 'mt-1 mb-4 text-[0.8rem] opacity-60';
const badgeClass = 'inline-block rounded-full bg-black/10 px-2 py-0.5 text-[0.7rem] font-semibold dark:bg-white/10';
const badgeFreeClass = 'inline-block rounded-full bg-brand-amber/20 px-2 py-0.5 text-[0.7rem] font-semibold text-brand-amber';
const errorClass = 'text-sm text-rose-600';
const emptyClass = 'opacity-60';
const successClass = 'text-[0.85rem] text-emerald-500';
const btnClass = 'inline-block rounded-lg px-5 py-2.5 text-sm disabled:opacity-60';
const btnPrimaryClass =
  'inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900';
const btnDangerClass =
  'inline-block rounded-lg border-none bg-gradient-to-br from-rose-500 to-red-600 px-5 py-2.5 text-sm text-white disabled:opacity-60';
const fieldClass = 'flex flex-col gap-1.5 text-[0.8rem] opacity-85';
const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-brand-amber focus:ring-3 focus:ring-brand-amber/20 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100';
const bookFormClass = 'flex max-w-2xl flex-col gap-4';
const adminSubheadingClass = 'mt-7 mb-3 text-[0.95rem]';
const avatarClass =
  'flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-amber to-brand-pink font-bold text-neutral-900';
const infoClass = 'flex min-w-0 flex-1 flex-col gap-0.5';
const titleTextClass = 'overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap';
const metaTextClass = 'text-[0.7rem] opacity-55';
const rowActionClass =
  'flex w-full items-center gap-3 rounded-lg border border-black/10 bg-transparent px-3.5 py-2.5 text-left text-inherit hover:border-brand-amber hover:bg-brand-amber/6 dark:border-white/10';

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className={panelClass}>
      <h2 className="m-0 text-[1.15rem]">{title}</h2>
      <p className={panelDescriptionClass}>{description}</p>
      <div>{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-black/10 p-4 dark:border-white/10">
      <span className="text-xs opacity-60">{label}</span>
      <strong className="text-[1.6rem]">{value}</strong>
    </div>
  );
}

// Équivalent de src/components/dashboard/admin/AdminBookGrantSection.tsx.
// La source pagine GET /users (pageSize 100) et concatène toutes les pages
// pour peupler un sélecteur — même logique ici, plus simple avec un
// <select> natif plutôt que le listbox personnalisé de la source (pas de
// recherche texte dans l'original non plus, juste une liste déroulante).
function BookGrantsSection() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [books, setBooks] = useState<GrantableBook[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [userId, setUserId] = useState('');
  const [bookId, setBookId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastGrant, setLastGrant] = useState<BookGrant | null>(null);

  const [grants, setGrants] = useState<BookGrant[] | null>(null);
  const [grantsTotal, setGrantsTotal] = useState(0);
  const [grantsPage, setGrantsPage] = useState(1);
  const grantsPageSize = 20;
  const [grantsError, setGrantsError] = useState<string | null>(null);
  const [grantToRevoke, setGrantToRevoke] = useState<number | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      try {
        const first = await apiClient.get('/users', { params: { page: 1, pageSize: 100 } });
        const firstData = first.data?.data;
        const total = firstData?.total ?? 0;
        const pageSize = firstData?.pageSize ?? 100;
        const pageCount = Math.ceil(total / pageSize);
        let items: AdminUser[] = firstData?.items ?? [];
        if (pageCount > 1) {
          const rest = await Promise.all(
            Array.from({ length: pageCount - 1 }, (_, i) => apiClient.get('/users', { params: { page: i + 2, pageSize: 100 } })),
          );
          items = items.concat(...rest.map((r) => r.data?.data?.items ?? []));
        }
        setUsers(items);
      } catch (err) {
        setLoadError(extractApiErrorMessage(err, 'Impossible de charger les utilisateurs.'));
      }
    }
    loadAll();

    apiClient
      .get('/books/mine')
      .then((res) => setBooks(res.data?.data ?? []))
      .catch((err) => setLoadError(extractApiErrorMessage(err, 'Impossible de charger les livres.')));
  }, []);

  function loadGrants() {
    apiClient
      .get('/users/book-grants', { params: { page: grantsPage, pageSize: grantsPageSize } })
      .then((res) => {
        setGrants(res.data?.data?.items ?? []);
        setGrantsTotal(res.data?.data?.total ?? 0);
      })
      .catch((err) => setGrantsError(extractApiErrorMessage(err, 'Impossible de charger les attributions.')));
  }

  useEffect(loadGrants, [grantsPage]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!userId || !bookId) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/users/${userId}/book-grants`, { bookId: Number(bookId), ...(note.trim() ? { note: note.trim() } : {}) });
      setLastGrant(res.data?.data ?? null);
      setNote('');
      setGrantsPage(1);
      loadGrants();
    } catch (err) {
      setFormError(extractApiErrorMessage(err, "Impossible d'attribuer ce livre."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmRevoke(grantId: number) {
    setIsRevoking(true);
    setRevokeError(null);
    try {
      await apiClient.delete(`/users/book-grants/${grantId}`);
      setGrantToRevoke(null);
      loadGrants();
    } catch (err) {
      setRevokeError(extractApiErrorMessage(err, 'Impossible de retirer cette attribution.'));
    } finally {
      setIsRevoking(false);
    }
  }

  if (loadError) return <p className={errorClass}>{loadError}</p>;
  if (users === null || books === null) return <p className={emptyClass}>Chargement…</p>;

  const canGrant = Boolean(userId && bookId) && !isSubmitting;
  const totalPages = Math.max(1, Math.ceil(grantsTotal / grantsPageSize));

  return (
    <Panel title="Attribuer un livre" description="Accordez l'accès complet à un livre sans paiement. L'attribution est enregistrée dans la bibliothèque du lecteur.">
      <form className={bookFormClass} onSubmit={handleSubmit}>
        <label className={fieldClass}>
          Lecteur
          <select value={userId} onChange={(e) => setUserId(e.target.value)} required className={inputClass}>
            <option value="" disabled>
              Sélectionnez un utilisateur
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {(u.name ?? u.email) + (u.name ? ` (${u.email})` : '')}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldClass}>
          Livre
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} required className={inputClass}>
            <option value="" disabled>
              Sélectionnez un livre
            </option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.isFree ? 'Gratuit' : `${formatPrice(b.price)} FCFA`}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldClass}>
          Note interne (facultative)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Ex. geste commercial, partenariat…"
            className={`${inputClass} resize-y`}
          />
        </label>

        {formError && <p className={errorClass}>{formError}</p>}
        {lastGrant && !formError && (
          <p className={successClass}>
            « {lastGrant.book.title} » a été attribué à {lastGrant.user.name ?? lastGrant.user.email}.
          </p>
        )}

        <button type="submit" disabled={!canGrant} className={`${btnPrimaryClass} w-fit`}>
          {isSubmitting ? 'Attribution…' : 'Attribuer le livre'}
        </button>
      </form>

      <h3 className={adminSubheadingClass}>
        Livres attribués {grantsTotal > 0 && <span className={badgeClass}>{grantsTotal}</span>}
      </h3>
      {grantsError && <p className={errorClass}>{grantsError}</p>}
      {revokeError && <p className={errorClass}>{revokeError}</p>}
      {grants === null ? (
        <p className={emptyClass}>Chargement…</p>
      ) : grants.length === 0 ? (
        <p className={emptyClass}>Aucun livre n'a encore été attribué.</p>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {grants.map((grant) => (
              <li
                key={grant.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3.5 py-2.5 text-[0.85rem] dark:border-white/10"
              >
                <span>
                  <strong>{grant.book.title}</strong> → {grant.user.name ?? grant.user.email}
                  {grant.user.name && <span className={metaTextClass}> ({grant.user.email})</span>}
                  {grant.note && <em className="not-italic opacity-60"> — {grant.note}</em>}
                  <span className={metaTextClass}>
                    {' · '}
                    {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(grant.date))}
                  </span>
                </span>
                {grantToRevoke === grant.id ? (
                  <span className="flex shrink-0 gap-1.5">
                    <button type="button" disabled={isRevoking} onClick={() => handleConfirmRevoke(grant.id)} className={btnDangerClass}>
                      {isRevoking ? 'Retrait…' : 'Confirmer'}
                    </button>
                    <button type="button" disabled={isRevoking} onClick={() => setGrantToRevoke(null)} className={btnClass}>
                      Annuler
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setGrantToRevoke(grant.id)} className={btnClass}>
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-6 text-[0.875rem]">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (grantsPage > 1) setGrantsPage((p) => p - 1);
                }}
                className="text-brand-amber no-underline hover:underline"
                style={{ opacity: grantsPage === 1 ? 0.4 : 1, pointerEvents: grantsPage === 1 ? 'none' : 'auto' }}
              >
                ← Précédent
              </a>
              <span>
                {grantsPage} / {totalPages}
              </span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (grantsPage < totalPages) setGrantsPage((p) => p + 1);
                }}
                className="text-brand-amber no-underline hover:underline"
                style={{ opacity: grantsPage === totalPages ? 0.4 : 1, pointerEvents: grantsPage === totalPages ? 'none' : 'auto' }}
              >
                Suivant →
              </a>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function formatChatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// Équivalent de src/components/dashboard/admin/AdminSupportSection.tsx — un
// seul fil par utilisateur (même modèle que refonte_rabi_mobile/app/(app)/inbox.tsx),
// pas de conversations multiples.
function SupportSection() {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  function loadConversations() {
    apiClient
      .get('/support/administration/conversations')
      .then((res) => setConversations(res.data?.data?.conversations ?? []))
      .catch((err) => setListError(extractApiErrorMessage(err, 'Impossible de charger les conversations.')));
  }

  useEffect(() => {
    if (selectedUserId === null) loadConversations();
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedUserId === null) return;
    setConversation(null);
    setThreadError(null);
    apiClient
      .get(`/support/administration/conversations/${selectedUserId}`)
      .then((res) => setConversation(res.data?.data ?? null))
      .catch((err) => setThreadError(extractApiErrorMessage(err, 'Impossible de charger cette conversation.')));
  }, [selectedUserId]);

  async function handleSend() {
    const text = content.trim();
    if (!text || selectedUserId === null || isSending) return;
    setIsSending(true);
    setSendError(null);
    try {
      const res = await apiClient.post(`/support/administration/conversations/${selectedUserId}/messages`, { content: text });
      const message: SupportMessage = res.data?.data;
      setContent('');
      setConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
    } catch (err) {
      setSendError(extractApiErrorMessage(err, "Impossible d'envoyer le message."));
    } finally {
      setIsSending(false);
    }
  }

  if (selectedUserId === null) {
    return (
      <Panel title="Support" description="Messages envoyés par les lecteurs depuis l'application mobile.">
        {listError ? (
          <p className={errorClass}>{listError}</p>
        ) : conversations === null ? (
          <p className={emptyClass}>Chargement…</p>
        ) : conversations.length === 0 ? (
          <p className={emptyClass}>Aucun message pour l'instant.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {conversations.map((item) => (
              <li key={item.userId}>
                <button type="button" onClick={() => setSelectedUserId(item.userId)} className={rowActionClass}>
                  <span className={avatarClass}>{((item.name ?? item.email).charAt(0) || '?').toUpperCase()}</span>
                  <span className={infoClass}>
                    <span className={titleTextClass}>{item.name ?? item.email}</span>
                    {item.lastMessage && (
                      <span className={metaTextClass}>
                        {item.lastMessage.sender === 'admin' ? 'Vous : ' : ''}
                        {item.lastMessage.content}
                      </span>
                    )}
                  </span>
                  {item.unreadCount > 0 && <span className={badgeFreeClass}>{item.unreadCount}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    );
  }

  return (
    <section className={`${panelClass} flex h-[calc(100vh-12rem)] min-h-96 flex-col overflow-hidden p-0`}>
      <div className="flex shrink-0 items-center gap-3.5 border-b border-black/10 px-5 py-4 dark:border-white/10">
        <button type="button" onClick={() => setSelectedUserId(null)} className={btnClass}>
          ← Retour
        </button>
        <span className={infoClass}>
          <span className={titleTextClass}>{conversation?.user.name ?? conversation?.user.email ?? '…'}</span>
          {conversation?.user.name && <span className={metaTextClass}>{conversation.user.email}</span>}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-5">
        {threadError ? (
          <p className={errorClass}>{threadError}</p>
        ) : conversation === null ? (
          <p className={emptyClass}>Chargement…</p>
        ) : (
          conversation.messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[0.85rem] ${
                  message.sender === 'admin'
                    ? 'rounded-br-md bg-brand-amber text-neutral-900'
                    : 'rounded-bl-md bg-black/10 dark:bg-white/10'
                }`}
              >
                <p className="m-0 whitespace-pre-wrap">{message.content}</p>
                <time className="mt-1 block text-[0.65rem] opacity-65">{formatChatTime(message.createdAt)}</time>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-black/10 px-4 py-3 dark:border-white/10">
        {sendError && <p className={errorClass}>{sendError}</p>}
        <div className="flex items-end gap-2.5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Répondre au lecteur…"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-black/10 bg-white px-3.5 py-2.5 text-[0.85rem] text-neutral-900 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={content.trim().length === 0 || isSending}
            className="flex size-10.5 shrink-0 items-center justify-center rounded-full bg-neutral-900 p-0 text-sm text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
          >
            ➤
          </button>
        </div>
      </div>
    </section>
  );
}

interface AuthorKycExtension {
  id: number;
  country: string | null;
  address: string | null;
  documentType: string | null;
  documentId: string | null;
  documents: string | null;
  fullName: string | null;
  socialLinks: Record<string, string> | null;
  privacyAcceptedAt: string | null;
  kycVerifiedAt: string | null;
}

interface AuthorKycReviewItem {
  id: number;
  name: string | null;
  email: string;
  extension: AuthorKycExtension | null;
  isComplete: boolean;
  isVerified: boolean;
}

const KYC_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  cni: "Carte nationale d'identité",
  passeport: 'Passeport',
  autre: 'Autre pièce',
};

const kycOptionBtnBase = 'rounded-xl border px-3.5 py-2.5 text-left text-[0.85rem]';

// Équivalent de src/components/dashboard/admin/AdminKycSection.tsx.
function KycSection() {
  const [authors, setAuthors] = useState<AuthorKycReviewItem[] | null>(null);
  const [bypassEnabled, setBypassEnabled] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isBypassSaving, setIsBypassSaving] = useState(false);
  const [bypassError, setBypassError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  function loadKyc() {
    apiClient
      .get('/authors/kyc')
      .then((res) => setAuthors(res.data?.data ?? []))
      .catch((err) => setLoadError(extractApiErrorMessage(err, 'Impossible de charger les KYC.')));
  }

  useEffect(() => {
    loadKyc();
    apiClient
      .get('/authors/kyc-bypass')
      .then((res) => setBypassEnabled(Boolean(res.data?.data?.enabled)))
      .catch((err) => setLoadError(extractApiErrorMessage(err, 'Impossible de charger la politique KYC.')));
  }, []);

  async function handleSetBypass(enabled: boolean) {
    setIsBypassSaving(true);
    setBypassError(null);
    try {
      const res = await apiClient.patch('/authors/kyc-bypass', { enabled });
      setBypassEnabled(Boolean(res.data?.data?.enabled));
    } catch (err) {
      setBypassError(extractApiErrorMessage(err, 'Impossible de modifier la politique KYC.'));
    } finally {
      setIsBypassSaving(false);
    }
  }

  async function handleVerify(authorId: number, verified: boolean) {
    setVerifyingId(authorId);
    setVerifyError(null);
    try {
      await apiClient.patch(`/authors/${authorId}/kyc-verification`, { verified });
      loadKyc();
    } catch (err) {
      setVerifyError(extractApiErrorMessage(err, 'Impossible de mettre à jour la vérification.'));
    } finally {
      setVerifyingId(null);
    }
  }

  if (loadError) return <p className={errorClass}>{loadError}</p>;
  if (authors === null || bypassEnabled === null) return <p className={emptyClass}>Chargement…</p>;

  const pending = authors.filter((a) => a.isComplete && !a.isVerified);
  const others = authors.filter((a) => !(a.isComplete && !a.isVerified));
  const ordered = [...pending, ...others];

  return (
    <Panel
      title="Vérification KYC"
      description={`${pending.length} soumission${pending.length > 1 ? 's' : ''} en attente de vérification.`}
    >
      <div className="mb-4 rounded-2xl border border-black/10 px-4.5 py-4 dark:border-white/10">
        <h3 className="mt-0 mb-3 text-[0.95rem]">Accès des auteurs sans KYC validé</h3>
        <p className={panelDescriptionClass}>
          Ce réglage s'applique immédiatement aux auteurs déjà inscrits et aux futurs comptes auteurs.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Politique KYC des auteurs">
          <button
            type="button"
            role="radio"
            aria-checked={!bypassEnabled}
            disabled={isBypassSaving}
            onClick={() => handleSetBypass(false)}
            className={`${kycOptionBtnBase} ${
              !bypassEnabled
                ? 'border-brand-amber bg-brand-amber/12'
                : 'border-black/10 bg-transparent text-inherit dark:border-white/10'
            }`}
          >
            Exiger le KYC
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={bypassEnabled}
            disabled={isBypassSaving}
            onClick={() => handleSetBypass(true)}
            className={`${kycOptionBtnBase} ${
              bypassEnabled
                ? 'border-[#e0a11c] bg-[#e0a11c]/15'
                : 'border-black/10 bg-transparent text-inherit dark:border-white/10'
            }`}
          >
            Bypasser le KYC
          </button>
        </div>
        {bypassEnabled && (
          <p className="mt-3 text-[0.8rem] text-[#e0a11c]">
            Les auteurs peuvent publier sans pièce d'identité ni validation administrative tant que cette option reste active.
          </p>
        )}
        {bypassError && <p className={errorClass}>{bypassError}</p>}
      </div>

      <h3 className={adminSubheadingClass}>Dossiers soumis</h3>
      {verifyError && <p className={errorClass}>{verifyError}</p>}
      {ordered.length === 0 ? (
        <p className={emptyClass}>Aucun auteur n'a encore soumis de KYC.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {ordered.map((author) => {
            const ext = author.extension;
            const isExpanded = expandedId === author.id;
            return (
              <li key={author.id} className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setExpandedId((id) => (id === author.id ? null : author.id))}
                  className="flex w-full items-center gap-3 border-none bg-transparent px-4.5 py-3 text-left text-inherit"
                >
                  <span className={avatarClass}>{((author.name ?? author.email).charAt(0) || '?').toUpperCase()}</span>
                  <span className={`${infoClass} flex-1`}>
                    <span className={titleTextClass}>{author.name ?? author.email}</span>
                    <span className={metaTextClass}>{author.email}</span>
                  </span>
                  <span className={author.isVerified ? badgeFreeClass : badgeClass}>
                    {author.isVerified ? 'Vérifié' : author.isComplete ? 'En attente' : 'Incomplet'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-black/10 px-4.5 py-4 dark:border-white/10">
                    {!ext ? (
                      <p className={emptyClass}>Aucune donnée KYC.</p>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3 text-[0.85rem]">
                        <div>
                          <span className={panelDescriptionClass}>Nom complet</span>
                          <p className="mt-0.5 font-semibold">{ext.fullName ?? '—'}</p>
                        </div>
                        <div>
                          <span className={panelDescriptionClass}>Pays</span>
                          <p className="mt-0.5 font-semibold">{ext.country ?? '—'}</p>
                        </div>
                        <div>
                          <span className={panelDescriptionClass}>Adresse</span>
                          <p className="mt-0.5 font-semibold">{ext.address ?? '—'}</p>
                        </div>
                        <div>
                          <span className={panelDescriptionClass}>Type de document</span>
                          <p className="mt-0.5 font-semibold">{ext.documentType ? (KYC_DOCUMENT_TYPE_LABELS[ext.documentType] ?? ext.documentType) : '—'}</p>
                        </div>
                        <div>
                          <span className={panelDescriptionClass}>Numéro du document</span>
                          <p className="mt-0.5 font-semibold">{ext.documentId ?? '—'}</p>
                        </div>
                        <div>
                          <span className={panelDescriptionClass}>Politique de confidentialité</span>
                          <p className="mt-0.5 font-semibold">{ext.privacyAcceptedAt ? 'Acceptée' : 'Non acceptée'}</p>
                        </div>
                      </div>
                    )}

                    {ext?.documents && (
                      <a href={ext.documents} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[0.85rem] text-brand-amber">
                        Voir la pièce d'identité →
                      </a>
                    )}

                    {ext?.socialLinks && Object.keys(ext.socialLinks).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {Object.entries(ext.socialLinks).map(([key, url]) => (
                          <a key={key} href={url} target="_blank" rel="noreferrer" className={`${badgeClass} no-underline`}>
                            {key}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="mt-4">
                      {author.isVerified ? (
                        <button
                          type="button"
                          disabled={verifyingId === author.id}
                          onClick={() => handleVerify(author.id, false)}
                          className={btnDangerClass}
                        >
                          {verifyingId === author.id ? 'Retrait…' : 'Révoquer la vérification'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={verifyingId === author.id || !author.isComplete}
                          onClick={() => handleVerify(author.id, true)}
                          className={btnPrimaryClass}
                        >
                          {verifyingId === author.id ? 'Vérification…' : 'Vérifier le KYC'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// Équivalent de src/components/dashboard/AdminDashboard.tsx — une seule
// requête (GET /users/administration/tableau-de-bord) pour pilotage,
// utilisateurs, catalogue, transactions et modération ; "Attribuer un livre",
// "Vérification KYC" et "Support" ont chacune leurs propres appels.
export default function AdminPanel() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('pilotage');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EditableAccount | null>(null);

  function handleAccountSaved(updated: EditableAccount) {
    setEditingAccount(null);
    setData((prev) => {
      if (!prev) return prev;
      if (updated.kind === 'user') {
        return {
          ...prev,
          recentUsers: prev.recentUsers.map((u) => (u.id === updated.id ? { ...u, name: updated.name, email: updated.email, isActive: updated.isActive, isAdmin: updated.isAdmin } : u)),
        };
      }
      return {
        ...prev,
        recentAuthors: prev.recentAuthors.map((a) => (a.id === updated.id ? { ...a, name: updated.name, email: updated.email, isAccountVerified: updated.isAccountVerified } : a)),
      };
    });
  }

  function loadDashboard() {
    apiClient
      .get('/users/administration/tableau-de-bord')
      .then((res) => setData(res.data?.data ?? null))
      .catch((err) => setError(extractApiErrorMessage(err, "Impossible de charger les données d'administration.")));
  }

  useEffect(() => {
    getSessionUser().then(setUser);
    loadDashboard();
  }, []);

  // Promotion lecteur -> auteur (cf. EditAccountModal) : change le compte de
  // table entière (users -> author), pas une simple mise à jour de champs —
  // on recharge tout le tableau de bord plutôt que de tenter une édition
  // chirurgicale de recentUsers/recentAuthors en local.
  function handleAccountPromoted() {
    setEditingAccount(null);
    loadDashboard();
  }

  // Même logique que la promotion : le compte disparaît de la liste plutôt
  // que d'être mis à jour, plus simple à refléter en rechargeant tout.
  function handleAccountDeleted() {
    setEditingAccount(null);
    loadDashboard();
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await apiClient.post('/auth/logout');
    } finally {
      window.location.href = '/connexion';
    }
  }

  if (user === null) {
    window.location.href = '/connexion?redirect=%2Fadministration';
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 dark:border-white/10 dark:bg-neutral-950">
        <a href="/" className="shrink-0 text-[1.1rem] font-black text-inherit no-underline sm:text-[1.2rem]">
          Rabi<span className="text-brand-amber">pek</span> <span className="text-xs font-semibold text-sky-400">Admin</span>
        </a>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
          {user && <span className="hidden max-w-40 truncate text-[0.8rem] opacity-60 sm:inline">{user.email}</span>}
          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className={`${btnClass} shrink-0 px-3.5 py-2 sm:px-5 sm:py-2.5`}>
            {isLoggingOut ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-black/10 p-3 md:w-60 md:flex-col md:border-r md:border-b-0 md:p-6 dark:border-white/10">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-sm whitespace-nowrap ${
                section === item.id ? 'bg-indigo-600 font-semibold text-white' : 'bg-none text-inherit hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 sm:px-7 sm:py-6">
          {error ? (
            <p className={errorClass}>{error}</p>
          ) : !data ? (
            <p className={emptyClass}>Chargement…</p>
          ) : section === 'utilisateurs' ? (
            <Panel title="Utilisateurs récents" description={`${data.counts.users} comptes et ${data.counts.authors} auteurs sur la plateforme. Cliquez sur un compte pour le modifier.`}>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {data.recentUsers.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      onClick={() => setEditingAccount({ kind: 'user', id: account.id, name: account.name, email: account.email, isActive: account.isActive, isAdmin: account.isAdmin })}
                      className={rowActionClass}
                    >
                      <span className={avatarClass}>{initial(account.name ?? account.email)}</span>
                      <span className={infoClass}>
                        <span className={titleTextClass}>{account.name ?? 'Compte sans nom'}</span>
                        <span className={metaTextClass}>{account.email}</span>
                      </span>
                      <span className={badgeClass}>{account.isAdmin ? 'Administrateur' : account.isActive ? 'Actif' : 'En attente'}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <h3 className={adminSubheadingClass}>Auteurs récents</h3>
              {data.recentAuthors.length === 0 ? (
                <p className={emptyClass}>Aucun auteur pour l'instant.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {data.recentAuthors.map((author) => (
                    <li key={author.id}>
                      <button
                        type="button"
                        onClick={() => setEditingAccount({ kind: 'author', id: author.id, name: author.name, email: author.email, isAccountVerified: author.isAccountVerified })}
                        className={rowActionClass}
                      >
                        <span className={avatarClass}>{initial(author.name ?? author.email)}</span>
                        <span className={infoClass}>
                          <span className={titleTextClass}>{author.name ?? 'Auteur sans nom'}</span>
                          <span className={metaTextClass}>{author.email}</span>
                        </span>
                        <span className={author.isKycVerified ? badgeFreeClass : badgeClass}>
                          {author.isKycVerified ? 'KYC vérifié' : author.isAccountVerified ? 'Compte vérifié' : 'En attente'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ) : section === 'catalogue' ? (
            <Panel title="Catalogue récent" description={`${data.counts.books} livres et ${data.counts.chapters} chapitres publiés.`}>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                {data.recentBooks.map((book) => (
                  <a
                    key={book.id}
                    href={`/livres/${book.slug}`}
                    className="flex items-center gap-3 rounded-2xl border border-black/10 px-3 py-2.5 no-underline text-inherit hover:border-brand-amber dark:border-white/10"
                  >
                    <span className={avatarClass}>{initial(book.title)}</span>
                    <span className={infoClass}>
                      <span className={titleTextClass}>{book.title}</span>
                      <span className={metaTextClass}>{book.author.name ?? book.author.email}</span>
                    </span>
                  </a>
                ))}
              </div>
            </Panel>
          ) : section === 'transactions' ? (
            <Panel title="Transactions" description="Vue consolidée des achats et du panier.">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                <Metric label="Chiffre d'affaires" value={`${formatPrice(data.revenue)} FCFA`} />
                <Metric label="Achats" value={String(data.counts.purchases)} />
                <Metric label="Paniers actifs" value={String(data.counts.carts)} />
              </div>
            </Panel>
          ) : section === 'book-grants' ? (
            <BookGrantsSection />
          ) : section === 'moderation' ? (
            <Panel title="Modération & engagement" description="Suivez les interactions de la communauté.">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                <Metric label="Commentaires" value={String(data.counts.reviews)} />
                <Metric label="Mentions J'aime" value={String(data.counts.likes)} />
                <Metric label="Partages" value={String(data.counts.shares)} />
              </div>
            </Panel>
          ) : section === 'kyc' ? (
            <KycSection />
          ) : section === 'support' ? (
            <SupportSection />
          ) : section === 'parametres' ? (
            <Panel title="Paramètres de la plateforme" description="Contrôle de votre session administrateur.">
              <div>
                <span className={panelDescriptionClass}>Session active</span>
                <p className="my-1">{user?.email}</p>
                <p className={`my-1 ${emptyClass}`}>Les réglages globaux seront centralisés ici.</p>
              </div>
            </Panel>
          ) : (
            <>
              <section className="rounded-3xl bg-gradient-to-br from-sky-400 via-indigo-600 to-violet-600 p-5 text-white sm:p-8">
                <p className="text-[0.85rem] font-semibold">👑 Centre de pilotage</p>
                <h1 className="my-3 max-w-lg text-[clamp(1.6rem,3vw,2.4rem)]">La plateforme sous contrôle.</h1>
                <p className="max-w-md opacity-80">Supervisez l'audience, le catalogue et l'activité de Rabipek en temps réel.</p>
                <button
                  type="button"
                  onClick={() => setSection('utilisateurs')}
                  className="mt-4 inline-block rounded-lg bg-white px-5 py-2.5 text-sm text-indigo-700"
                >
                  Gérer les utilisateurs →
                </button>
              </section>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                <Metric label="Utilisateurs" value={String(data.counts.users)} />
                <Metric label="Auteurs" value={String(data.counts.authors)} />
                <Metric label="Livres" value={String(data.counts.books)} />
                <Metric label="Chiffre d'affaires" value={`${formatPrice(data.revenue)} FCFA`} />
              </div>

              <Panel title="Dernières publications" description="Les livres récemment ajoutés au catalogue.">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                  {data.recentBooks.slice(0, 4).map((book) => (
                    <a
                      key={book.id}
                      href={`/livres/${book.slug}`}
                      className="flex items-center gap-3 rounded-2xl border border-black/10 px-3 py-2.5 no-underline text-inherit hover:border-brand-amber dark:border-white/10"
                    >
                      <span className={avatarClass}>{initial(book.title)}</span>
                      <span className={infoClass}>
                        <span className={titleTextClass}>{book.title}</span>
                        <span className={metaTextClass}>{book.author.name ?? book.author.email}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </main>
      </div>

      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSaved={handleAccountSaved}
          onPromoted={handleAccountPromoted}
          onDeleted={handleAccountDeleted}
        />
      )}
    </div>
  );
}
