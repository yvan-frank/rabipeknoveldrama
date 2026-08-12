"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertAuthorOwnership = assertAuthorOwnership;
const ApiError_1 = require("./ApiError");
// Un admin peut tout faire ; un auteur ne peut agir que sur ses propres livres/chapitres.
// Tant que l'auth Clerk d'authorabipek n'est pas reliée à ce serveur (cf. README),
// `authorId` n'est jamais renseigné pour un role 'author' authentifié via ce module,
// donc cette vérification échoue systématiquement pour eux — c'est voulu (fail-safe)
// plutôt que de laisser passer une action non attribuable avec certitude.
function assertAuthorOwnership(user, authorId) {
    if (user.role === 'admin')
        return;
    if (user.role === 'author' && user.authorId === authorId)
        return;
    throw ApiError_1.ApiError.forbidden("Vous n'êtes pas autorisé à modifier cette ressource");
}
//# sourceMappingURL=ownership.js.map