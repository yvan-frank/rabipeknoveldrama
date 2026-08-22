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

bookEpubEditionsRouter.use(requireAuth, requireRole('author', 'admin'), requireAuthorKyc);
bookEpubEditionsRouter.get('/:id/epub-editions', validate(epubEditionIdParamSchema, 'params'), asyncHandler(epubController.listEpubEditionsHandler));
bookEpubEditionsRouter.post('/:id/epub-editions', validate(epubEditionIdParamSchema, 'params'), asyncHandler(epubController.createEpubEditionHandler));
