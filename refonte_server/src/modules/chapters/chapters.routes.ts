import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { optionalAuth, requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { requireAuthorKyc } from '../../middlewares/authorKyc.middleware';
import {
  bookIdParamSchema,
  chapterIdParamSchema,
  createChapterSchema,
  updateChapterSchema,
} from './chapters.schema';
import * as chaptersController from './chapters.controller';

export const chaptersRouter = Router();

chaptersRouter.get(
  '/book/:bookId',
  validate(bookIdParamSchema, 'params'),
  asyncHandler(chaptersController.listChaptersByBookHandler),
);

// Espace auteur : chapitre complet (contenu inclus) pour édition, sans le
// paywall lecteur — chemin à deux segments, jamais capturé par `/:id` ci-dessous.
chaptersRouter.get(
  '/manage/:id',
  requireAuth,
  requireRole('author', 'admin'),
  validate(chapterIdParamSchema, 'params'),
  asyncHandler(chaptersController.getChapterForManageHandler),
);

chaptersRouter.get(
  '/:id',
  optionalAuth,
  validate(chapterIdParamSchema, 'params'),
  asyncHandler(chaptersController.getChapterHandler),
);

chaptersRouter.post(
  '/',
  requireAuth,
  requireRole('author', 'admin'),
  requireAuthorKyc,
  validate(createChapterSchema),
  asyncHandler(chaptersController.createChapterHandler),
);

chaptersRouter.patch(
  '/:id',
  requireAuth,
  requireRole('author', 'admin'),
  requireAuthorKyc,
  validate(chapterIdParamSchema, 'params'),
  validate(updateChapterSchema),
  asyncHandler(chaptersController.updateChapterHandler),
);

chaptersRouter.delete(
  '/:id',
  requireAuth,
  requireRole('author', 'admin'),
  requireAuthorKyc,
  validate(chapterIdParamSchema, 'params'),
  asyncHandler(chaptersController.deleteChapterHandler),
);
