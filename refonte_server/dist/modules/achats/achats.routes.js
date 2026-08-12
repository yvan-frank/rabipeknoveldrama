"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.achatsRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
// TODO: suivre le pattern auth/users. Point sensible : intégration PayPal.
//   POST   /checkout          créer une transaction (PayPal order) à partir du panier
//   POST   /capture/:orderId  capturer le paiement PayPal, créer les lignes `achat`
//   GET    /                  historique d'achats de l'utilisateur connecté
// Recommandation issue de l'audit DB : stocker metadata/bookdata en colonnes JSON
// (déjà fait dans prisma/schema.prisma) et envisager une table payment_transactions
// dédiée si le rapprochement comptable devient un besoin.
exports.achatsRouter = (0, express_1.Router)();
exports.achatsRouter.use(auth_middleware_1.requireAuth);
exports.achatsRouter.get('/', (_req, res) => {
    res.status(501).json({ success: false, message: 'Non implémenté : GET /achats' });
});
//# sourceMappingURL=achats.routes.js.map