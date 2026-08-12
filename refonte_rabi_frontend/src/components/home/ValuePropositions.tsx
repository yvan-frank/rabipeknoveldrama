import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BookOpenCheck, Feather, Sparkles } from 'lucide-react';
import { RevealOnScroll } from './RevealOnScroll';

interface ValueProp {
  kicker: string;
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  image: string;
}

// Chaque photo doit être déposée dans public/images/ sous ce nom exact.
const VALUE_PROPS: ValueProp[] = [
  {
    kicker: 'Pour les auteurs',
    icon: Feather,
    title: 'Publier un livre sur RabipekNovel',
    description:
      "RabipekNovel s'occupe de tout pour que vous puissiez écrire sereinement et laisser votre empreinte dans le monde entier.",
    buttonLabel: 'Découvrir nos livres',
    buttonHref: '/livres',
    image: '/images/valeur-1.jpg',
  },
  {
    kicker: 'Une plateforme pensée pour vous',
    icon: Sparkles,
    title: 'Innovation numérique',
    description: "Sur RabipekNovel, votre livre n'est pas juste publié, il est officiel.",
    buttonLabel: 'Publier un livre',
    buttonHref: '/inscription',
    image: '/images/valeur-2.jpg',
  },
  {
    kicker: 'Pour les lecteurs',
    icon: BookOpenCheck,
    title: 'Voyage dans un monde de passion enchantée',
    description:
      'Plongez dans des histoires qui éveillent vos émotions et transportent votre imagination, chapitre après chapitre.',
    buttonLabel: 'Commencer à lire',
    buttonHref: '/livres',
    image: '/images/valeur-3.jpg',
  },
];

export function ValuePropositions() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-20 sm:gap-28 sm:py-28">
      {VALUE_PROPS.map((prop, index) => {
        const Icon = prop.icon;
        const reversed = index % 2 === 1;

        return (
          <RevealOnScroll
            key={prop.title}
            className={`flex flex-col items-center gap-10 lg:gap-16 ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
          >
            <div className="relative w-full max-w-md shrink-0 lg:w-1/2">
              <div
                aria-hidden
                className={`pointer-events-none absolute -z-10 size-72 rounded-full blur-[100px] ${
                  reversed ? '-right-10 -bottom-10 bg-brand-pink/30' : '-top-10 -left-10 bg-brand-amber/30'
                }`}
              />
              <div className="group relative aspect-4/5 w-full overflow-hidden rounded-[2rem] border border-black/10 shadow-2xl dark:border-white/10">
                <Image
                  src={prop.image}
                  alt={prop.title}
                  width={500}
                  height={625}
                  sizes="(max-width: 1024px) 90vw, 500px"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
              <span className="absolute -top-4 -left-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber to-brand-pink text-lg font-black text-black shadow-lg">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="flex w-full flex-col items-start gap-5 lg:w-1/2">
              <span className="flex items-center gap-2 rounded-full border border-brand-amber/30 bg-brand-amber/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-amber uppercase">
                <Icon size={14} />
                {prop.kicker}
              </span>
              <h2 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{prop.title}</h2>
              <p className="max-w-lg text-base text-black/60 dark:text-white/60">{prop.description}</p>
              <Link
                href={prop.buttonHref}
                className="group mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-7 py-3 text-sm font-semibold text-black shadow-lg shadow-brand-amber/20 transition hover:opacity-90"
              >
                {prop.buttonLabel}
                <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </Link>
            </div>
          </RevealOnScroll>
        );
      })}
    </section>
  );
}
