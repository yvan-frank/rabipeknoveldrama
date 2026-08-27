interface Props {
  name: string;
  [key: string]: unknown;
}

// Composant temporaire pour les ilots pas encore ecrits (cf. registry.ts) —
// permet a toutes les pages PHP du scaffold de rendre sans erreur pendant
// que chaque ilot reel est implemente au fil de l'eau.
export default function Placeholder({ name }: Props) {
  return (
    <div style={{ padding: '0.75rem 1rem', border: '1px dashed var(--border)', borderRadius: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>
      Îlot React « {name} » à implémenter.
    </div>
  );
}
