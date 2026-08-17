import type { Metadata } from 'next';
import { ArrowUpRight, BookOpen, Mail, Wrench } from 'lucide-react';
import { MaintenanceCountdown } from '@/components/maintenance/MaintenanceCountdown';

export const metadata: Metadata = {
  title: 'Maintenance en cours',
  description: 'RabipekNovel revient bientôt avec une expérience encore meilleure.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#100c19] px-5 py-6 text-white sm:px-8 sm:py-8">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(235,25,131,0.2),transparent_29%),radial-gradient(circle_at_83%_74%,rgba(245,158,11,0.18),transparent_30%),linear-gradient(135deg,#100c19_0%,#171020_50%,#0d0d16_100%)]" />
      <div aria-hidden className="absolute top-[18%] -left-24 h-72 w-72 rounded-full border border-white/10" />
      <div aria-hidden className="absolute -right-24 bottom-[10%] h-96 w-96 rounded-full border border-white/[0.07]" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-10 lg:p-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-amber to-brand-pink text-neutral-950 shadow-lg shadow-brand-pink/20">
              <BookOpen size={20} strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold tracking-tight">Rabipek<span className="text-brand-amber">Novel</span></span>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/65 sm:flex">
            <span className="size-1.5 animate-pulse rounded-full bg-brand-amber" />
            Mise à jour en cours
          </span>
        </header>

        <div className="my-auto grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-amber/25 bg-brand-amber/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-brand-amber uppercase">
              <Wrench size={14} />
              En maintenance
            </div>
            <h1 className="max-w-xl text-4xl leading-[1.07] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Nous peaufinons votre prochaine{' '}
              <span className="bg-gradient-to-r from-brand-amber via-orange-300 to-brand-pink bg-clip-text text-transparent">lecture.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/60 sm:text-lg">
              RabipekNovel se refait une beauté pour vous offrir une expérience de lecture encore plus fluide, inspirante et immersive.
            </p>

            <a
              href="mailto:contact@rabipeknovel.com"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-brand-amber"
            >
              <Mail size={16} />
              Une question ? Écrivez-nous
              <ArrowUpRight size={15} />
            </a>
          </div>

          <div className="relative">
            <div aria-hidden className="absolute -inset-6 rounded-full bg-brand-pink/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#17121f]/80 p-5 sm:p-7">
              <div aria-hidden className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-brand-amber/80 to-transparent" />
              <p className="mb-5 text-center text-xs font-semibold tracking-[0.18em] text-white/50 uppercase">Retour estimé dans</p>
              <MaintenanceCountdown />
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/45">
                <span className="size-1.5 rounded-full bg-brand-pink" />
                Merci de votre patience
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} RabipekNovel. Toutes les histoires comptent.</p>
          <p>Une nouvelle page se prépare.</p>
        </footer>
      </section>
    </main>
  );
}
