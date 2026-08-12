import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clapperboard, Sparkles } from 'lucide-react';
import { MOCK_DRAMA_EPISODES } from '@/lib/mock-drama';
import { DramaCard } from '@/components/drama/DramaCard';

export const metadata: Metadata = {
  openGraph: { type: 'website', url: 'https://rabipeknovel.com/rabipek-drama', images: [{ url: 'https://rabipeknovel.com/images/rabipek-about-hero.png', width: 1200, height: 984, alt: 'RabipekDrama' }] },
  alternates: { canonical: '/rabipek-drama' },
  title: 'RabipekDrama | RabipekNovel',
  description: 'RabipekDrama : les histoires RabipekNovel bientôt en courtes vidéos, épisode par épisode.',
};

export default function RabipekDramaPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative isolate bg-[#100f18] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(236,72,153,.28),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(245,158,11,.22),transparent_32%)]" />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-amber-100 uppercase">
            <Clapperboard size={14} />
            Bientôt disponible
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            RabipekDrama : vos histoires en vidéo
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-white/70 sm:text-lg">
            Vos histoires préférées prennent vie en courtes vidéos, épisode par épisode. Un format vertical, immersif,
            pensé pour se laisser porter entre deux pages.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/livres"
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-neutral-950 transition hover:-translate-y-0.5 hover:bg-amber-200"
            >
              Découvrir le catalogue
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/inscription"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Devenir auteur
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-[.18em] text-brand-pink uppercase">Un avant-goût</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Des dramas en préparation</h2>
          <p className="mt-5 text-base leading-7 text-black/65 dark:text-white/65">
            Ces vignettes illustrent le format à venir — les vraies vidéos seront publiées par nos auteurs dès
            l’ouverture de RabipekDrama.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {MOCK_DRAMA_EPISODES.map((episode) => (
            <DramaCard key={episode.id} episode={episode} />
          ))}
        </div>
      </section>

      <section className="bg-[#f7f0e4] py-16 text-center dark:bg-white/[.035] sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber to-brand-pink text-black">
            <Sparkles size={20} />
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Vous êtes auteur RabipekNovel ?</h2>
          <p className="mt-4 text-base leading-7 text-black/65 dark:text-white/65">
            RabipekDrama vous permettra bientôt de transformer vos récits en courtes vidéos directement depuis votre
            espace auteur.
          </p>
        </div>
      </section>
    </div>
  );
}
