import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { authorIdParamSchema, kycBypassSchema, kycSchema, kycVerificationSchema } from './authors.schema';
import * as authorsController from './authors.controller';

// TODO: suivre le pattern auth/users. Endpoints attendus (cf. authorController.js legacy) :
//   GET    /                  liste des auteurs (public)
//   GET    /:id               profil auteur (+ extension, livres, stats income)
//   POST   /register          inscription auteur (email + password -> bcrypt)
//   PATCH  /:id                mise à jour profil / extension
// Note : authorabipek (Next.js) utilise Clerk pour l'auth UI — à décider si on
// vérifie aussi les JWT Clerk côté API ou si on garde un système dédié séparé.
export const authorsRouter = Router();

authorsRouter.get('/', (_req, res) => {
  res.status(501).json({ success: false, message: 'Non implémenté : GET /authors' });
});

// KYC : volontairement PAS gardé par requireAuthorKyc, sous peine de ne
// jamais pouvoir le soumettre (poule/œuf) — cf. middlewares/authorKyc.middleware.ts.
authorsRouter.get('/moi/kyc', requireAuth, requireRole('author'), asyncHandler(authorsController.getMyKycHandler));
authorsRouter.post(
  '/moi/kyc',
  requireAuth,
  requireRole('author'),
  validate(kycSchema),
  asyncHandler(authorsController.submitKycHandler),
);

// Espace admin : file de vérification KYC.
authorsRouter.get(
  '/kyc',
  requireAuth,
  requireRole('admin'),
  asyncHandler(authorsController.listAuthorsForKycReviewHandler),
);
authorsRouter.get(
  '/kyc-bypass',
  requireAuth,
  requireRole('admin'),
  asyncHandler(authorsController.getAuthorKycBypassPolicyHandler),
);
authorsRouter.patch(
  '/kyc-bypass',
  requireAuth,
  requireRole('admin'),
  validate(kycBypassSchema),
  asyncHandler(authorsController.setAuthorKycBypassPolicyHandler),
);
authorsRouter.patch(
  '/:authorId/kyc-verification',
  requireAuth,
  requireRole('admin'),
  validate(authorIdParamSchema, 'params'),
  validate(kycVerificationSchema),
  asyncHandler(authorsController.setAuthorKycVerificationHandler),
);
