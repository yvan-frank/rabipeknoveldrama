import Link from 'next/link';
import type { Metadata } from 'next';
import {BookDashed, LucideIcon} from 'lucide-react';
import { BookOpenText, Clapperboard, Headphones, Play, Sparkles, Star, Users } from 'lucide-react';
import { serverFetch } from '@/lib/api';
import { BookCard } from '@/components/BookCard';
import { ValuePropositions } from '@/components/home/ValuePropositions';
import type { BookSummary, Paginated, TopRatedBook } from '@/types/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rabipeknovel.com';
const HOME_OG_IMAGE = `${SITE_URL}/images/rabipek-about-hero.png`;

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
  title: 'Livres africains en ligne',
  description: 'Découvrez des livres, des auteurs et des histoires africaines sur RabipekNovel.',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'RabipekNovel — Livres africains en ligne',
    description: 'Découvrez des livres, des auteurs et des histoires africaines sur RabipekNovel.',
    images: [{ url: HOME_OG_IMAGE, width: 1200, height: 984, alt: 'RabipekNovel, littérature africaine en ligne' }],
  },
  twitter: { card: 'summary_large_image', images: [{ url: HOME_OG_IMAGE, width: 1200, height: 984, alt: 'RabipekNovel, littérature africaine en ligne' }] },
};

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

const FEATURES: Feature[] = [
  {
    icon: Headphones,
    title: 'Lecture immersive',
    description:
      "Écoutez chaque chapitre à voix haute avec surbrillance mot par mot, choisissez la voix et la vitesse de lecture.",
  },
  {
    icon: BookOpenText,
    title: 'Catalogue riche',
    description: 'Romans, poésie, développement personnel — des œuvres pour tous les goûts, mises à jour en continu.',
  },
  {
    icon: Users,
    title: 'Auteurs locaux',
    description: 'Chaque lecture soutient directement les auteurs et autrices qui publient sur la plateforme.',
  },
  {
    icon: Clapperboard,
    title: 'Drama shorts',
    description: 'Vos romans préférés adaptés en courtes vidéos verticales, façon série à épisodes. Bientôt disponible.',
    badge: 'Bientôt',
  },
];

async function getFeaturedBooks(): Promise<BookSummary[]> {
  try {
    const { items } = await serverFetch<Paginated<BookSummary>>('/books?page=1&pageSize=6');
    return items;
  } catch {
    return [];
  }
}

async function getTopRatedBooks(): Promise<TopRatedBook[]> {
  try {
    return await serverFetch<TopRatedBook[]>('/books/top-rated?limit=6');
  } catch {
    return [];
  }
}

export default async function Home() {
  const [featuredBooks, topRatedBooks] = await Promise.all([getFeaturedBooks(), getTopRatedBooks()]);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#0a0a0a] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-brand-amber/30 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 -right-24 h-96 w-96 rounded-full bg-brand-pink/30 blur-[120px]"
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-28 text-center sm:py-36">
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur">
            <BookDashed size={14} className="text-brand-amber" />
            La librairie numérique nouvelle génération
          </span>

          <h1 className="max-w-3xl text-4xl leading-tight font-extrabold tracking-tight sm:text-6xl sm:leading-tight">
            Lisez. Écoutez.{' '}
            <span className="bg-gradient-to-r from-brand-amber to-brand-pink bg-clip-text text-transparent">
              Vivez chaque histoire.
            </span>
          </h1>

          <p className="max-w-xl text-base text-white/60 sm:text-lg">
            Rabipek réinvente la lecture numérique : un catalogue vivant, une expérience de lecture immersive avec
            voix off synchronisée, et des auteurs soutenus à chaque page tournée.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/livres"
              className="rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-8 py-3 text-sm font-semibold text-black shadow-lg shadow-brand-amber/20 transition hover:opacity-90"
            >
              Découvrir le catalogue
            </Link>
            <Link
              href="/inscription"
              className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>

      <ValuePropositions />

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, badge }) => (
            <div
              key={title}
              className="group relative flex flex-col gap-4 rounded-2xl border border-black/10 p-6 transition hover:-translate-y-1 hover:border-brand-amber/40 hover:shadow-xl dark:border-white/10"
            >
              {badge && (
                <span className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-2.5 py-1 text-[10px] font-semibold tracking-wide text-black uppercase">
                  {badge}
                </span>
              )}
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-amber to-brand-pink text-black">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-black/60 dark:text-white/60">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Teaser Rabipek Drama */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#1a0d14] px-6 py-14 text-white sm:px-12 dark:border-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-brand-pink/25 blur-[110px]"
          />

          <div className="relative flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-md flex-col items-center gap-4 text-center lg:items-start lg:text-left">
              <span className="flex items-center gap-2 rounded-full border border-brand-pink/40 bg-brand-pink/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-pink uppercase">
                <Clapperboard size={14} />
                Nouveau · Bientôt disponible
              </span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Rabipek Drama</h2>
              <p className="text-white/60">
                Vos histoires préférées prennent vie en courtes vidéos verticales façon drama — des épisodes rapides
                à regarder entre deux chapitres, directement dans l&apos;app.
              </p>
              <Link
                href="/inscription"
                className="mt-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Être averti au lancement
              </Link>
            </div>

            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`relative aspect-9/16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0 sm:w-32 ${
                    i === 1 ? 'translate-y-[-12px]' : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                      <Play size={16} className="ml-0.5 fill-white text-white" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Livres les mieux notés */}
      {topRatedBooks.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Star size={22} className="fill-brand-amber text-brand-amber" />
              Les mieux notés
            </h2>
            <Link href="/livres" className="text-sm font-medium text-brand-amber hover:underline">
              Voir tout le catalogue →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {topRatedBooks.map((book) => (
              <BookCard key={book.id} book={book} averageRating={book.averageRating} reviewCount={book.reviewCount} />
            ))}
          </div>
        </section>
      )}

      {/* Livres à la une */}
      {featuredBooks.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">À la une</h2>
            <Link href="/livres" className="text-sm font-medium text-brand-amber hover:underline">
              Voir tout le catalogue →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] px-8 py-16 text-center text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-amber/20 via-transparent to-brand-pink/20"
          />
          <div className="relative flex flex-col items-center gap-6">
            <h2 className="max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">
              Votre prochaine lecture vous attend.
            </h2>
            <p className="max-w-md text-white/60">
              Rejoignez Rabipek gratuitement et commencez à lire — ou à écouter — dès aujourd&apos;hui.
            </p>
            <Link
              href="/inscription"
              className="rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-8 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
