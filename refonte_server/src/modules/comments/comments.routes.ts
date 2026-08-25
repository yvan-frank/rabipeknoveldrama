import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import {
  bookIdParamSchema,
  chapterCommentIdParamSchema,
  chapterIdParamSchema,
  createChapterCommentSchema,
  upsertReviewSchema,
  replyToReviewSchema,
} from './comments.schema';
import * as commentsController from './comments.controller';

export const commentsRouter = Router();

commentsRouter.get(
  '/book/:bookId',
  validate(bookIdParamSchema, 'params'),
  asyncHandler(commentsController.listBookReviewsHandler),
);

commentsRouter.post(
  '/book/:bookId',
  requireAuth,
  validate(bookIdParamSchema, 'params'),
  validate(upsertReviewSchema),
  asyncHandler(commentsController.upsertBookReviewHandler),
);

commentsRouter.post('/review/:commentId/reply', requireAuth, requireRole('author', 'admin'), validate(z.object({ commentId: z.coerce.number().int().positive() }), 'params'), validate(replyToReviewSchema), asyncHandler(commentsController.replyToBookReviewHandler));

// Fil de discussion par chapitre. Réservé aux lecteurs authentifiés (User)
// pour l'instant — les comptes Author n'ont pas encore de système d'auth
// câblé sur ce serveur (cf. README), donc pas de distinction "réponse
// d'auteur" possible côté API tant que ce chantier n'est pas fait.
commentsRouter.get(
  '/chapter/:chapterId',
  validate(chapterIdParamSchema, 'params'),
  asyncHandler(commentsController.listChapterCommentsHandler),
);

commentsRouter.post(
  '/chapter/:chapterId',
  requireAuth,
  validate(chapterIdParamSchema, 'params'),
  validate(createChapterCommentSchema),
  asyncHandler(commentsController.createChapterCommentHandler),
);

commentsRouter.delete(
  '/chapter-comment/:commentId',
  requireAuth,
  validate(chapterCommentIdParamSchema, 'params'),
  asyncHandler(commentsController.deleteChapterCommentHandler),
);
