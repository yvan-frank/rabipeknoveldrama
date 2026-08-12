import { ApiError } from './ApiError';
import type { AuthUser } from '../modules/auth/auth.types';

// Un admin peut tout faire ; un auteur ne peut agir que sur ses propres livres/chapitres.
// Tant que l'auth Clerk d'authorabipek n'est pas reliée à ce serveur (cf. README),
// `authorId` n'est jamais renseigné pour un role 'author' authentifié via ce module,
// donc cette vérification échoue systématiquement pour eux — c'est voulu (fail-safe)
// plutôt que de laisser passer une action non attribuable avec certitude.
export function assertAuthorOwnership(user: AuthUser, authorId: number) {
  if (user.role === 'admin') return;
  if (user.role === 'author' && user.authorId === authorId) return;
  throw ApiError.forbidden("Vous n'êtes pas autorisé à modifier cette ressource");
}
