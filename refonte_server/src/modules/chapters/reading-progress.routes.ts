import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { bookReadingProgressParamSchema, updateReadingProgressSchema } from './chapters.schema';
import * as chaptersController from './chapters.controller';

// Monté sous /books dans routes/index.ts : /books/:id/reading-progress.
// Séparé de chapters.routes.ts car la ressource est le livre, pas le chapitre.
// Middlewares passés par route (pas via .use() sans chemin) : un .use() non
// scopé s'exécute avant qu'Express n'ait fait correspondre `:id/reading-progress`
// et valide donc req.params.id alors qu'il est encore vide (=> NaN, 400 à tort).
export const bookReadingProgressRouter = Router();

bookReadingProgressRouter.get(
  '/:id/reading-progress',
  requireAuth,
  validate(bookReadingProgressParamSchema, 'params'),
  asyncHandler(chaptersController.getReadingProgressHandler),
);
bookReadingProgressRouter.put(
  '/:id/reading-progress',
  requireAuth,
  validate(bookReadingProgressParamSchema, 'params'),
  validate(updateReadingProgressSchema),
  asyncHandler(chaptersController.updateReadingProgressHandler),
);
