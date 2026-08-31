import { useRequireAuth } from '../lib/useRequireAuth';

interface Props {
  redirect?: string;
}

// Îlot minimal pour les pages sans autre îlot React (ex. author/revenus.php,
// contenu statique) : ne rend rien, redirige juste vers /connexion si aucune
// session n'est active. Cf. useRequireAuth.ts.
export default function AuthGuard({ redirect }: Props) {
  useRequireAuth(redirect);
  return null;
}
