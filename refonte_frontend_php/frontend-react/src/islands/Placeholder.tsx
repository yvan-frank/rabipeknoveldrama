interface Props {
  name: string;
  [key: string]: unknown;
}

// Composant temporaire pour les ilots pas encore ecrits (cf. registry.ts) —
// permet a toutes les pages PHP du scaffold de rendre sans erreur pendant
// que chaque ilot reel est implemente au fil de l'eau.
export default function Placeholder({ name }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-black/10 px-4 py-3 text-sm opacity-60 dark:border-white/10">
      Îlot React « {name} » à implémenter.
    </div>
  );
}
