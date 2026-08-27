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

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="dashboard-panel">
      <h2>{title}</h2>
      <p className="dashboard-panel__description">{description}</p>
      <div className="dashboard-panel__body">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-metric">
      <span className="dashboard-metric__label">{label}</span>
      <strong className="dashboard-metric__value">{value}</strong>
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

  if (loadError) return <p className="review-form__error">{loadError}</p>;
  if (users === null || books === null) return <p className="empty">Chargement…</p>;

  const canGrant = Boolean(userId && bookId) && !isSubmitting;
  const totalPages = Math.max(1, Math.ceil(grantsTotal / grantsPageSize));

  return (
    <Panel title="Attribuer un livre" description="Accordez l'accès complet à un livre sans paiement. L'attribution est enregistrée dans la bibliothèque du lecteur.">
      <form className="book-form" onSubmit={handleSubmit}>
        <label className="book-form__field">
          Lecteur
          <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
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

        <label className="book-form__field">
          Livre
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} required>
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

        <label className="book-form__field">
          Note interne (facultative)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} placeholder="Ex. geste commercial, partenariat…" />
        </label>

        {formError && <p className="review-form__error">{formError}</p>}
        {lastGrant && !formError && (
          <p className="kyc-form__success">
            « {lastGrant.book.title} » a été attribué à {lastGrant.user.name ?? lastGrant.user.email}.
          </p>
        )}

        <button type="submit" className="btn btn--primary" disabled={!canGrant}>
          {isSubmitting ? 'Attribution…' : 'Attribuer le livre'}
        </button>
      </form>

      <h3 className="admin-subheading">
        Livres attribués {grantsTotal > 0 && <span className="badge">{grantsTotal}</span>}
      </h3>
      {grantsError && <p className="review-form__error">{grantsError}</p>}
      {revokeError && <p className="review-form__error">{revokeError}</p>}
      {grants === null ? (
        <p className="empty">Chargement…</p>
      ) : grants.length === 0 ? (
        <p className="empty">Aucun livre n'a encore été attribué.</p>
      ) : (
        <>
          <ul className="admin-grant-list">
            {grants.map((grant) => (
              <li key={grant.id}>
                <span>
                  <strong>{grant.book.title}</strong> → {grant.user.name ?? grant.user.email}
                  {grant.user.name && <span className="dashboard-book__meta"> ({grant.user.email})</span>}
                  {grant.note && <em> — {grant.note}</em>}
                  <span className="dashboard-book__meta">
                    {' · '}
                    {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(grant.date))}
                  </span>
                </span>
                {grantToRevoke === grant.id ? (
                  <span className="admin-grant-list__confirm">
                    <button type="button" className="btn btn--danger" disabled={isRevoking} onClick={() => handleConfirmRevoke(grant.id)}>
                      {isRevoking ? 'Retrait…' : 'Confirmer'}
                    </button>
                    <button type="button" className="btn" disabled={isRevoking} onClick={() => setGrantToRevoke(null)}>
                      Annuler
                    </button>
                  </span>
                ) : (
                  <button type="button" className="btn" onClick={() => setGrantToRevoke(grant.id)}>
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="pagination">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (grantsPage > 1) setGrantsPage((p) => p - 1);
                }}
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
          <p className="review-form__error">{listError}</p>
        ) : conversations === null ? (
          <p className="empty">Chargement…</p>
        ) : conversations.length === 0 ? (
          <p className="empty">Aucun message pour l'instant.</p>
        ) : (
          <ul className="support-conv-list">
            {conversations.map((item) => (
              <li key={item.userId}>
                <button type="button" onClick={() => setSelectedUserId(item.userId)}>
                  <span className="dashboard-book__avatar">{((item.name ?? item.email).charAt(0) || '?').toUpperCase()}</span>
                  <span className="dashboard-book__info">
                    <span className="dashboard-book__title">{item.name ?? item.email}</span>
                    {item.lastMessage && (
                      <span className="dashboard-book__meta">
                        {item.lastMessage.sender === 'admin' ? 'Vous : ' : ''}
                        {item.lastMessage.content}
                      </span>
                    )}
                  </span>
                  {item.unreadCount > 0 && <span className="badge badge--free">{item.unreadCount}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    );
  }

  return (
    <section className="dashboard-panel support-thread">
      <div className="support-thread__head">
        <button type="button" className="btn" onClick={() => setSelectedUserId(null)}>
          ← Retour
        </button>
        <span className="dashboard-book__info">
          <span className="dashboard-book__title">{conversation?.user.name ?? conversation?.user.email ?? '…'}</span>
          {conversation?.user.name && <span className="dashboard-book__meta">{conversation.user.email}</span>}
        </span>
      </div>

      <div className="support-thread__messages">
        {threadError ? (
          <p className="review-form__error">{threadError}</p>
        ) : conversation === null ? (
          <p className="empty">Chargement…</p>
        ) : (
          conversation.messages.map((message) => (
            <div key={message.id} className={`support-bubble-row support-bubble-row--${message.sender}`}>
              <div className="support-bubble">
                <p>{message.content}</p>
                <time>{formatChatTime(message.createdAt)}</time>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="support-thread__composer">
        {sendError && <p className="review-form__error">{sendError}</p>}
        <div className="support-thread__composer-row">
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
          />
          <button type="button" className="btn btn--primary" onClick={handleSend} disabled={content.trim().length === 0 || isSending}>
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

  if (loadError) return <p className="review-form__error">{loadError}</p>;
  if (authors === null || bypassEnabled === null) return <p className="empty">Chargement…</p>;

  const pending = authors.filter((a) => a.isComplete && !a.isVerified);
  const others = authors.filter((a) => !(a.isComplete && !a.isVerified));
  const ordered = [...pending, ...others];

  return (
    <Panel
      title="Vérification KYC"
      description={`${pending.length} soumission${pending.length > 1 ? 's' : ''} en attente de vérification.`}
    >
      <div className="kyc-bypass-panel">
        <h3 className="admin-subheading">Accès des auteurs sans KYC validé</h3>
        <p className="dashboard-panel__description">
          Ce réglage s'applique immédiatement aux auteurs déjà inscrits et aux futurs comptes auteurs.
        </p>
        <div className="kyc-bypass-panel__options" role="radiogroup" aria-label="Politique KYC des auteurs">
          <button
            type="button"
            role="radio"
            aria-checked={!bypassEnabled}
            disabled={isBypassSaving}
            className={!bypassEnabled ? 'is-active' : ''}
            onClick={() => handleSetBypass(false)}
          >
            Exiger le KYC
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={bypassEnabled}
            disabled={isBypassSaving}
            className={bypassEnabled ? 'is-active is-active--warning' : ''}
            onClick={() => handleSetBypass(true)}
          >
            Bypasser le KYC
          </button>
        </div>
        {bypassEnabled && (
          <p className="kyc-bypass-panel__warning">
            Les auteurs peuvent publier sans pièce d'identité ni validation administrative tant que cette option reste active.
          </p>
        )}
        {bypassError && <p className="review-form__error">{bypassError}</p>}
      </div>

      <h3 className="admin-subheading">Dossiers soumis</h3>
      {verifyError && <p className="review-form__error">{verifyError}</p>}
      {ordered.length === 0 ? (
        <p className="empty">Aucun auteur n'a encore soumis de KYC.</p>
      ) : (
        <ul className="kyc-review-list">
          {ordered.map((author) => {
            const ext = author.extension;
            const isExpanded = expandedId === author.id;
            return (
              <li key={author.id} className="kyc-review-item">
                <button
                  type="button"
                  className="kyc-review-item__head"
                  onClick={() => setExpandedId((id) => (id === author.id ? null : author.id))}
                >
                  <span className="dashboard-book__avatar">{((author.name ?? author.email).charAt(0) || '?').toUpperCase()}</span>
                  <span className="dashboard-book__info">
                    <span className="dashboard-book__title">{author.name ?? author.email}</span>
                    <span className="dashboard-book__meta">{author.email}</span>
                  </span>
                  <span className={`badge${author.isVerified ? ' badge--free' : ''}`}>
                    {author.isVerified ? 'Vérifié' : author.isComplete ? 'En attente' : 'Incomplet'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="kyc-review-item__body">
                    {!ext ? (
                      <p className="empty">Aucune donnée KYC.</p>
                    ) : (
                      <div className="kyc-review-item__grid">
                        <div>
                          <span className="dashboard-panel__description">Nom complet</span>
                          <p>{ext.fullName ?? '—'}</p>
                        </div>
                        <div>
                          <span className="dashboard-panel__description">Pays</span>
                          <p>{ext.country ?? '—'}</p>
                        </div>
                        <div>
                          <span className="dashboard-panel__description">Adresse</span>
                          <p>{ext.address ?? '—'}</p>
                        </div>
                        <div>
                          <span className="dashboard-panel__description">Type de document</span>
                          <p>{ext.documentType ? (KYC_DOCUMENT_TYPE_LABELS[ext.documentType] ?? ext.documentType) : '—'}</p>
                        </div>
                        <div>
                          <span className="dashboard-panel__description">Numéro du document</span>
                          <p>{ext.documentId ?? '—'}</p>
                        </div>
                        <div>
                          <span className="dashboard-panel__description">Politique de confidentialité</span>
                          <p>{ext.privacyAcceptedAt ? 'Acceptée' : 'Non acceptée'}</p>
                        </div>
                      </div>
                    )}

                    {ext?.documents && (
                      <a href={ext.documents} target="_blank" rel="noreferrer" className="kyc-review-item__doc-link">
                        Voir la pièce d'identité →
                      </a>
                    )}

                    {ext?.socialLinks && Object.keys(ext.socialLinks).length > 0 && (
                      <div className="kyc-review-item__social">
                        {Object.entries(ext.socialLinks).map(([key, url]) => (
                          <a key={key} href={url} target="_blank" rel="noreferrer" className="badge">
                            {key}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="kyc-review-item__actions">
                      {author.isVerified ? (
                        <button
                          type="button"
                          className="btn btn--danger"
                          disabled={verifyingId === author.id}
                          onClick={() => handleVerify(author.id, false)}
                        >
                          {verifyingId === author.id ? 'Retrait…' : 'Révoquer la vérification'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--primary"
                          disabled={verifyingId === author.id || !author.isComplete}
                          onClick={() => handleVerify(author.id, true)}
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
    <div className="dashboard dashboard--admin">
      <header className="dashboard__header">
        <a href="/" className="dashboard__logo">
          Rabi<span>pek</span> <span className="dashboard__logo-badge">Admin</span>
        </a>
        <div className="dashboard__header-actions">
          {user && <span className="dashboard__email">{user.email}</span>}
          <button type="button" className="btn" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </div>
      </header>

      <div className="dashboard__body">
        <nav className="dashboard__nav">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} type="button" className={section === item.id ? 'is-active' : ''} onClick={() => setSection(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>

        <main className="dashboard__main">
          {error ? (
            <p className="review-form__error">{error}</p>
          ) : !data ? (
            <p className="empty">Chargement…</p>
          ) : section === 'utilisateurs' ? (
            <Panel title="Utilisateurs récents" description={`${data.counts.users} comptes et ${data.counts.authors} auteurs sur la plateforme. Cliquez sur un compte pour le modifier.`}>
              <ul className="admin-user-list">
                {data.recentUsers.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      className="admin-user-list__row"
                      onClick={() => setEditingAccount({ kind: 'user', id: account.id, name: account.name, email: account.email, isActive: account.isActive, isAdmin: account.isAdmin })}
                    >
                      <span className="dashboard-book__avatar">{initial(account.name ?? account.email)}</span>
                      <span className="dashboard-book__info">
                        <span className="dashboard-book__title">{account.name ?? 'Compte sans nom'}</span>
                        <span className="dashboard-book__meta">{account.email}</span>
                      </span>
                      <span className="badge">{account.isAdmin ? 'Administrateur' : account.isActive ? 'Actif' : 'En attente'}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <h3 className="admin-subheading">Auteurs récents</h3>
              {data.recentAuthors.length === 0 ? (
                <p className="empty">Aucun auteur pour l'instant.</p>
              ) : (
                <ul className="admin-user-list">
                  {data.recentAuthors.map((author) => (
                    <li key={author.id}>
                      <button
                        type="button"
                        className="admin-user-list__row"
                        onClick={() => setEditingAccount({ kind: 'author', id: author.id, name: author.name, email: author.email, isAccountVerified: author.isAccountVerified })}
                      >
                        <span className="dashboard-book__avatar">{initial(author.name ?? author.email)}</span>
                        <span className="dashboard-book__info">
                          <span className="dashboard-book__title">{author.name ?? 'Auteur sans nom'}</span>
                          <span className="dashboard-book__meta">{author.email}</span>
                        </span>
                        <span className={`badge${author.isKycVerified ? ' badge--free' : ''}`}>
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
              <div className="dashboard-book-grid">
                {data.recentBooks.map((book) => (
                  <a key={book.id} href={`/livres/${book.slug}`} className="dashboard-book">
                    <span className="dashboard-book__avatar">{initial(book.title)}</span>
                    <span className="dashboard-book__info">
                      <span className="dashboard-book__title">{book.title}</span>
                      <span className="dashboard-book__meta">{book.author.name ?? book.author.email}</span>
                    </span>
                  </a>
                ))}
              </div>
            </Panel>
          ) : section === 'transactions' ? (
            <Panel title="Transactions" description="Vue consolidée des achats et du panier.">
              <div className="dashboard-metrics">
                <Metric label="Chiffre d'affaires" value={`${formatPrice(data.revenue)} FCFA`} />
                <Metric label="Achats" value={String(data.counts.purchases)} />
                <Metric label="Paniers actifs" value={String(data.counts.carts)} />
              </div>
            </Panel>
          ) : section === 'book-grants' ? (
            <BookGrantsSection />
          ) : section === 'moderation' ? (
            <Panel title="Modération & engagement" description="Suivez les interactions de la communauté.">
              <div className="dashboard-metrics">
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
              <div className="dashboard-settings">
                <span className="dashboard-panel__description">Session active</span>
                <p>{user?.email}</p>
                <p className="empty">Les réglages globaux seront centralisés ici.</p>
              </div>
            </Panel>
          ) : (
            <>
              <section className="dashboard-hero dashboard-hero--admin">
                <p className="dashboard-hero__eyebrow">👑 Centre de pilotage</p>
                <h1>La plateforme sous contrôle.</h1>
                <p>Supervisez l'audience, le catalogue et l'activité de Rabipek en temps réel.</p>
                <button type="button" className="btn btn--primary" onClick={() => setSection('utilisateurs')}>
                  Gérer les utilisateurs →
                </button>
              </section>

              <div className="dashboard-metrics">
                <Metric label="Utilisateurs" value={String(data.counts.users)} />
                <Metric label="Auteurs" value={String(data.counts.authors)} />
                <Metric label="Livres" value={String(data.counts.books)} />
                <Metric label="Chiffre d'affaires" value={`${formatPrice(data.revenue)} FCFA`} />
              </div>

              <Panel title="Dernières publications" description="Les livres récemment ajoutés au catalogue.">
                <div className="dashboard-book-grid">
                  {data.recentBooks.slice(0, 4).map((book) => (
                    <a key={book.id} href={`/livres/${book.slug}`} className="dashboard-book">
                      <span className="dashboard-book__avatar">{initial(book.title)}</span>
                      <span className="dashboard-book__info">
                        <span className="dashboard-book__title">{book.title}</span>
                        <span className="dashboard-book__meta">{book.author.name ?? book.author.email}</span>
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
        />
      )}
    </div>
  );
}
