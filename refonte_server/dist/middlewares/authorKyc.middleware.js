"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuthorKyc = requireAuthorKyc;
const authors_service_1 = require("../modules/authors/authors.service");
// Bloque les actions d'écriture (création/modification/suppression de livres
// et chapitres) tant qu'un auteur n'a pas complété son KYC — cf. demande :
// "avant de faire quoi que ce soit dans le système, le kyc doit être vérifié".
// Un admin n'est jamais concerné (rôle différent) ; un rôle 'user' n'atteint
// jamais ces routes (déjà bloqué par requireRole('author','admin') en amont).
async function requireAuthorKyc(req, _res, next) {
    if (req.user?.role !== 'author') {
        next();
        return;
    }
    try {
        await (0, authors_service_1.assertAuthorKycComplete)(req.user.authorId);
        next();
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=authorKyc.middleware.js.map