// Tokens visuels partagés de l'espace auteur ("dark luxe" / glassmorphism) —
// un seul endroit à faire évoluer pour garder les 8 écrans cohérents entre
// eux plutôt que de retaper les mêmes longues chaînes Tailwind partout.
// Palette volontairement forcée en sombre (pas de variantes dark:) : cet
// espace est un "studio" immersif indépendant du thème clair/sombre du
// reste du site public.

export const glassPanel =
  'rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl';

export const glassPanelHover =
  'transition duration-300 hover:border-white/20 hover:bg-white/[0.055]';

export const glassInset = 'rounded-2xl border border-white/10 bg-black/20';

export const gradientText = 'bg-gradient-to-r from-brand-amber via-orange-300 to-brand-pink bg-clip-text text-transparent';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-[0_8px_24px_-8px_rgba(245,158,11,0.6)] transition duration-200 hover:scale-[1.03] hover:shadow-[0_12px_32px_-8px_rgba(245,158,11,0.75)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/85 backdrop-blur transition duration-200 hover:border-white/30 hover:bg-white/[0.09] disabled:pointer-events-none disabled:opacity-50';

export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white';

export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-sm font-medium text-rose-300 transition duration-200 hover:border-rose-500/50 hover:bg-rose-500/20 disabled:pointer-events-none disabled:opacity-50';

export const inputBase =
  'w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-amber/60 focus:bg-black/35 focus:ring-4 focus:ring-brand-amber/10';

export const labelBase = 'flex flex-col gap-1.5 text-[0.8rem] font-medium text-white/60';

export const pageHeading = 'text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]';

export const pageSubheading = 'mt-1.5 text-sm text-white/50';

export const sectionLabel = 'text-[0.7rem] font-semibold tracking-[0.14em] text-white/40 uppercase';

export const badgeBase = 'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold';
export const badgeAmber = `${badgeBase} border-brand-amber/30 bg-brand-amber/10 text-brand-amber`;
export const badgeEmerald = `${badgeBase} border-emerald-500/30 bg-emerald-500/10 text-emerald-300`;
export const badgeRose = `${badgeBase} border-rose-500/30 bg-rose-500/10 text-rose-300`;
export const badgeNeutral = `${badgeBase} border-white/15 bg-white/[0.05] text-white/60`;

export const skeletonPulse = 'animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]';

export const errorText = 'text-sm text-rose-300';
export const emptyText = 'text-sm text-white/40';
