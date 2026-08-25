import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { requireAuthorKyc } from '../../middlewares/authorKyc.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { epubEditionIdParamSchema } from './epub.schema';
import * as epubController from './epub.controller';

export const epubEditionsRouter = Router();

epubEditionsRouter.get('/:id/download', requireAuth, validate(epubEditionIdParamSchema, 'params'), asyncHandler(epubController.downloadEpubEditionHandler));

export const bookEpubEditionsRouter = Router();

// Middleware passé directement à chaque route (pas via .use() sans chemin) :
// un .use() non scopé s'appliquerait à TOUT /books/* qui transite par ce
// router, y compris les requêtes destinées à bookEpubReaderRouter/
// bookReadingProgressRouter montés au même préfixe (bug constaté : un lecteur
// recevait 403 sur /books/:id/reading-progress à cause de ce garde auteur).
const requireAuthorAccess = [requireAuth, requireRole('author', 'admin'), requireAuthorKyc] as const;
bookEpubEditionsRouter.get('/:id/epub-editions', ...requireAuthorAccess, validate(epubEditionIdParamSchema, 'params'), asyncHandler(epubController.listEpubEditionsHandler));
bookEpubEditionsRouter.post('/:id/epub-editions', ...requireAuthorAccess, validate(epubEditionIdParamSchema, 'params'), asyncHandler(epubController.createEpubEditionHandler));

// Distinct de bookEpubEditionsRouter ci-dessus : accessible à tout utilisateur
// authentifié (pas seulement l'auteur/admin), pour que l'app mobile lecteur
// puisse savoir si une édition à jour existe avant de proposer le
// téléchargement — sans droit de déclencher une génération ni voir l'historique.
export const bookEpubReaderRouter = Router();

bookEpubReaderRouter.get(
  '/:id/epub-editions/current',
  requireAuth,
  validate(epubEditionIdParamSchema, 'params'),
  asyncHandler(epubController.getCurrentEpubEditionHandler),
);
