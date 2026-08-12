import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';

// TODO: suivre le pattern auth/users. Point sensible : intégration PayPal.
//   POST   /checkout          créer une transaction (PayPal order) à partir du panier
//   POST   /capture/:orderId  capturer le paiement PayPal, créer les lignes `achat`
//   GET    /                  historique d'achats de l'utilisateur connecté
// Recommandation issue de l'audit DB : stocker metadata/bookdata en colonnes JSON
// (déjà fait dans prisma/schema.prisma) et envisager une table payment_transactions
// dédiée si le rapprochement comptable devient un besoin.
export const achatsRouter = Router();

achatsRouter.use(requireAuth);

achatsRouter.get('/', (_req, res) => {
  res.status(501).json({ success: false, message: 'Non implémenté : GET /achats' });
});
