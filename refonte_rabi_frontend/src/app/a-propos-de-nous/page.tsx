import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BookOpenText, HeartHandshake, Sparkles, Telescope } from 'lucide-react';

export const metadata: Metadata = {
  openGraph: { type: 'website', url: 'https://rabipeknovel.com/a-propos-de-nous', images: [{ url: 'https://rabipeknovel.com/images/rabipek-about-hero.png', width: 1200, height: 984, alt: 'RabipekNovel' }] },
  alternates: { canonical: '/a-propos-de-nous' },
  title: 'À propos de nous | RabipekNovel',
  description: 'RabipekNovel révèle la richesse des plumes africaines et rapproche les lecteurs de récits authentiques.',
};

const pillars = [
  { icon: Telescope, title: 'Révéler les voix', text: 'Offrir une scène aux auteurs émergents et aux récits qui méritent de voyager.' },
  { icon: BookOpenText, title: 'Rendre la lecture accessible', text: 'Des livres à portée de main, sur tous les supports numériques.' },
  { icon: HeartHandshake, title: 'Faire vivre les émotions', text: 'Créer un lien direct entre des histoires sincères et leurs futurs lecteurs.' },
];

export default function AProposPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative isolate bg-[#100f18] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_15%,rgba(245,158,11,.28),transparent_26%),radial-gradient(circle_at_88%_86%,rgba(236,72,153,.2),transparent_30%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:gap-16 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-amber-100 uppercase"><Sparkles size={14} /> L’âme des récits africains</p>
            <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight sm:text-6xl">Des histoires qui portent notre monde.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/70 sm:text-lg">RabipekNovel est une plateforme numérique dédiée aux extraits et aux livres de tous genres : un espace où la plume africaine trouve sa lumière, son public et son avenir.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/livres" className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-bold text-neutral-950 transition hover:-translate-y-0.5 hover:bg-amber-200">Découvrir le catalogue <ArrowRight size={16} /></Link><Link href="/inscription" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Rejoindre RabipekNovel</Link></div>
          </div>
          <div className="relative mx-auto w-full max-w-xl"><div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-amber-300/30 via-transparent to-pink-500/30 blur-2xl" /><div className="relative aspect-[1.22] overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl shadow-black/40"><Image src="/images/rabipek-about-hero.png" alt="Lecteurs africains découvrant des histoires sur livre et liseuse" width={1200} height={984} priority sizes="(max-width: 1024px) 100vw, 560px" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#100f18]/55 via-transparent to-transparent" /><div className="absolute right-5 bottom-5 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm font-medium backdrop-blur-md">Lire. Ressentir. Partager.</div></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><div className="max-w-3xl"><p className="text-sm font-semibold tracking-[.18em] text-brand-pink uppercase">Notre raison d’être</p><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Une littérature qui ne demande plus la permission d’exister.</h2><p className="mt-7 text-base leading-8 text-black/70 dark:text-white/70">L’Afrique et le monde regorgent d’excellents conteurs et romanciers. Après avoir été longtemps inondés par des œuvres venues d’ailleurs, il est temps de mettre en lumière des romans qui révèlent la richesse de la culture et de la plume africaines.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{pillars.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[1.6rem] border border-black/10 bg-gradient-to-b from-white to-amber-50/60 p-6 shadow-sm dark:border-white/10 dark:from-white/[.04] dark:to-amber-300/[.04]"><div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber to-brand-pink text-black"><Icon size={20} /></div><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">{text}</p></article>)}</div></section>

      <section className="bg-[#f7f0e4] py-16 dark:bg-white/[.035] sm:py-24"><div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"><div><p className="text-sm font-semibold tracking-[.18em] text-brand-pink uppercase">Une promesse aux auteurs</p><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Publier, être vu, vivre de son talent.</h2><p className="mt-6 text-base leading-8 text-black/70 dark:text-white/70">Créée pour donner une visibilité aux auteurs émergents, souvent limités par des moyens financiers, RabipekNovel leur permet de publier leurs œuvres en ligne et de les vendre directement. En un clic, leurs créations prennent le chemin d’une promotion globale.</p><p className="mt-5 text-base leading-8 text-black/70 dark:text-white/70">À l’ère du numérique, la littérature aussi embrasse sa révolution. Nous nous engageons à rendre les romans africains accessibles à tous, sans éloigner les auteurs de la valeur de leur travail.</p></div><div className="rounded-[2rem] bg-[#17121d] p-7 text-white shadow-xl sm:p-9"><p className="text-xs font-semibold tracking-[.18em] text-amber-200 uppercase">RabipekNovel, c’est…</p><blockquote className="mt-6 font-serif text-2xl leading-relaxed sm:text-3xl">« Plus qu’une plateforme, une invitation au voyage émotionnel. »</blockquote><div className="mt-10 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 text-sm"><p className="text-white/60">Pour les lecteurs<br /><span className="font-semibold text-white">des récits accessibles</span></p><p className="text-white/60">Pour les auteurs<br /><span className="font-semibold text-white">une visibilité réelle</span></p></div></div></div></section>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8"><p className="mx-auto max-w-3xl font-serif text-2xl leading-relaxed text-black/80 dark:text-white/80 sm:text-4xl">Du rire aux larmes, de la révolte au romantisme, du suspense aux mystères du monde invisible.</p><p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-black/65 dark:text-white/65">Chaque mois, RabipekNovel propose des nouveautés choisies avec soin pour vos envies d’évasion littéraire. Nous sommes votre complice pour des émotions fortes et des expériences inoubliables.</p><Link href="/livres" className="mt-9 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:scale-[1.02]">Trouver ma prochaine histoire <ArrowRight size={16} /></Link></section>
    </div>
  );
}
