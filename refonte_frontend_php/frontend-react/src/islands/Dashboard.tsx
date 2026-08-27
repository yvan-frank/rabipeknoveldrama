import { useEffect, useState, type ReactNode } from 'react';
import { apiClient, extractApiErrorMessage, getSessionUser, type SessionUser } from '../lib/apiClient';

interface DashboardBook {
  id: number;
  title: string;
  slug: string;
  cover: string | null;
}

interface LibraryEntry {
  id: number;
  book: DashboardBook;
  totalChapters: number;
  chapterRead: number | null;
  purchased: boolean;
  purchasedParts: string[];
}

interface DashboardData {
  cart: Array<{ id: number; book: DashboardBook }>;
  purchases: Array<{ id: number; date: string; book: DashboardBook }>;
  recentReads: Array<{ id: number; chapterRead: number; readAt: string; book: DashboardBook }>;
  library: LibraryEntry[];
  likedBooks: Array<{ id: number; book: DashboardBook }>;
  counts: { cart: number; purchases: number; reads: number; likes: number; comments: number; shares: number };
}

type Section = 'accueil' | 'bibliotheque' | 'favoris' | 'panier' | 'activite' | 'parametres';

const NAV_ITEMS: Array<{ id: Section; label: string }> = [
  { id: 'accueil', label: "Vue d'ensemble" },
  { id: 'bibliotheque', label: 'Ma bibliothèque' },
  { id: 'favoris', label: 'Mes favoris' },
  { id: 'panier', label: 'Mon panier' },
  { id: 'activite', label: 'Mon activité' },
  { id: 'parametres', label: 'Paramètres' },
];

function initial(book: DashboardBook): string {
  return book.title.slice(0, 1).toUpperCase();
}

function BookCard({ book, href, meta }: { book: DashboardBook; href: string; meta: string }) {
  return (
    <a href={href} className="dashboard-book">
      <span className="dashboard-book__avatar">{initial(book)}</span>
      <span className="dashboard-book__info">
        <span className="dashboard-book__title">{book.title}</span>
        <span className="dashboard-book__meta">{meta}</span>
      </span>
    </a>
  );
}

function BookGrid({ items, emptyText }: { items: Array<{ key: number; book: DashboardBook; href: string; meta: string }>; emptyText: string }) {
  if (items.length === 0) return <p className="empty">{emptyText}</p>;
  return (
    <div className="dashboard-book-grid">
      {items.map((item) => (
        <BookCard key={item.key} book={item.book} href={item.href} meta={item.meta} />
      ))}
    </div>
  );
}

function LibraryGrid({ entries, emptyText }: { entries: LibraryEntry[]; emptyText: string }) {
  if (entries.length === 0) return <p className="empty">{emptyText}</p>;
  return (
    <div className="dashboard-book-grid">
      {entries.map((entry) => {
        const progress = entry.chapterRead && entry.totalChapters > 0 ? Math.min(100, Math.round((entry.chapterRead / entry.totalChapters) * 100)) : 0;
        const status = entry.purchased
          ? 'Acheté'
          : entry.purchasedParts.length > 0
            ? `${entry.purchasedParts.length} partie${entry.purchasedParts.length > 1 ? 's' : ''} achetée${entry.purchasedParts.length > 1 ? 's' : ''}`
            : entry.chapterRead
              ? `Chapitre ${entry.chapterRead}/${entry.totalChapters}`
              : 'Pas encore commencé';
        return (
          <a key={entry.id} href={`/livres/${entry.book.slug}`} className="dashboard-book dashboard-book--library">
            <span className="dashboard-book__avatar">{initial(entry.book)}</span>
            <span className="dashboard-book__info">
              <span className="dashboard-book__title">{entry.book.title}</span>
              <span className="dashboard-book__meta">{status}</span>
              <span className="dashboard-progress">
                <span className="dashboard-progress__bar" style={{ width: `${progress}%` }} />
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="dashboard-metric">
      <span className="dashboard-metric__label">{label}</span>
      <strong className="dashboard-metric__value">{value}</strong>
    </div>
  );
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

// Équivalent de src/components/dashboard/UserDashboard.tsx — un seul appel
// (GET /users/moi/tableau-de-bord, réservé au rôle "user" côté API), navigué
// par onglets côté client puisque tout ici est déjà chargé en une fois.
export default function Dashboard() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('accueil');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    getSessionUser().then(setUser);
    apiClient
      .get('/users/moi/tableau-de-bord')
      .then((res) => setData(res.data?.data ?? null))
      .catch((err) => setError(extractApiErrorMessage(err, 'Impossible de charger votre espace.')));
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await apiClient.post('/auth/logout');
    } finally {
      window.location.href = '/connexion';
    }
  }

  if (user === null) {
    window.location.href = '/connexion?redirect=%2Ftableau-de-bord';
    return null;
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <a href="/" className="dashboard__logo">
          Rabi<span>pek</span>
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
            <button
              key={item.id}
              type="button"
              className={section === item.id ? 'is-active' : ''}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="dashboard__main">
          {error ? (
            <p className="review-form__error">{error}</p>
          ) : !data ? (
            <p className="empty">Chargement…</p>
          ) : section === 'bibliotheque' ? (
            <Panel title="Ma bibliothèque" description="Vos livres achetés ou entamés, avec votre progression de lecture.">
              <LibraryGrid entries={data.library} emptyText="Commencez la lecture d'un livre pour le retrouver ici." />
            </Panel>
          ) : section === 'favoris' ? (
            <Panel title="Mes favoris" description="Les livres que vous souhaitez retrouver facilement.">
              <BookGrid
                items={data.likedBooks.map((l) => ({ key: l.id, book: l.book, href: `/livres/${l.book.slug}`, meta: 'Voir le livre' }))}
                emptyText="Ajoutez un coup de cœur depuis le catalogue."
              />
            </Panel>
          ) : section === 'panier' ? (
            <Panel title="Mon panier" description="Vos prochaines lectures sont ici.">
              <BookGrid
                items={data.cart.map((c) => ({ key: c.id, book: c.book, href: `/livres/${c.book.slug}`, meta: 'Voir le livre' }))}
                emptyText="Votre panier est vide."
              />
            </Panel>
          ) : section === 'activite' ? (
            <Panel title="Mon activité" description="Votre empreinte dans la communauté Rabipek.">
              <div className="dashboard-metrics">
                <Metric label="Commentaires" value={data.counts.comments} />
                <Metric label="Partages" value={data.counts.shares} />
                <Metric label="Lectures" value={data.counts.reads} />
              </div>
            </Panel>
          ) : section === 'parametres' ? (
            <Panel title="Paramètres du compte" description="Vos informations de connexion et préférences.">
              <div className="dashboard-settings">
                <span className="dashboard-panel__description">Adresse e-mail</span>
                <p>{user?.email}</p>
                <p className="empty">La modification du profil sera disponible prochainement.</p>
              </div>
            </Panel>
          ) : (
            <>
              <section className="dashboard-hero">
                <p className="dashboard-hero__eyebrow">✨ Votre espace de lecture</p>
                <h1>Bonjour, bienvenue dans votre prochain chapitre.</h1>
                <p>Retrouvez vos livres, vos favoris et votre activité en un seul endroit.</p>
                <a href="/livres" className="btn btn--primary">
                  Explorer le catalogue →
                </a>
              </section>

              <div className="dashboard-metrics">
                <Metric label="Dans ma bibliothèque" value={data.counts.purchases} />
                <Metric label="Coups de cœur" value={data.counts.likes} />
                <Metric label="Dans mon panier" value={data.counts.cart} />
                <Metric label="Interactions" value={data.counts.comments + data.counts.shares} />
              </div>

              <Panel title="Livres en cours de lecture" description="Reprenez exactement là où vous vous étiez arrêté.">
                <BookGrid
                  items={data.recentReads.map((r) => ({
                    key: r.id,
                    book: r.book,
                    href: `/livres/${r.book.slug}/chapitres/${r.chapterRead}`,
                    meta: `Chapitre ${r.chapterRead} · reprendre la lecture`,
                  }))}
                  emptyText="Commencez une lecture depuis le catalogue."
                />
              </Panel>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
