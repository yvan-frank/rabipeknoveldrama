import { Clapperboard, Play } from 'lucide-react';
import type { MockDramaEpisode } from '@/lib/mock-drama';

interface DramaCardProps {
  episode: MockDramaEpisode;
}

// Vignette factice (dégradé + icône) tant qu'il n'y a pas de vraies vidéos —
// pas de <Link>, cette section est une vitrine "bientôt disponible", pas
// encore une fonctionnalité cliquable.
export function DramaCard({ episode }: DramaCardProps) {
  return (
    <article className="group relative flex aspect-9/16 w-full flex-col justify-end overflow-hidden rounded-2xl border border-black/10 shadow-lg dark:border-white/10">
      <div className={`absolute inset-0 bg-gradient-to-br ${episode.gradient} opacity-90 transition duration-500 group-hover:scale-105`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

      <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        {episode.genre}
      </span>

      <span className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
        <Play size={15} className="ml-0.5 fill-white" />
      </span>

      <div className="relative flex flex-col gap-1 p-4 text-white">
        <h3 className="text-sm font-bold leading-snug">{episode.title}</h3>
        <p className="text-xs text-white/70">Par {episode.author}</p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/60">
          <span className="flex items-center gap-1">
            <Clapperboard size={12} />
            {episode.episodeCount} épisodes
          </span>
          <span>·</span>
          <span>{episode.duration}/épisode</span>
        </div>
      </div>
    </article>
  );
}
