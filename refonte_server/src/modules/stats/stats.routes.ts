import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { statsBookIdParamSchema, viewStatsQuerySchema } from './stats.schema';
import * as statsController from './stats.controller';

// TODO: suivre le pattern auth/users. Consolider les 4 tables de vues legacy
// (viewbooks, views_books_by_country, views_books_by_platform, views_book_per_day)
// derrière une seule API de stats, avec `views_book_per_day` comme table de faits
// et les deux autres calculées par agrégation (cf. recommandation de l'audit DB).
//   GET /books/:id/views?from=&to=&groupBy=day|country|platform
//   GET /books/:id/summary   (total vues, likes, partages, lectures, revenus)
//   GET /authors/:id/income  (accessible à l'auteur concerné ou à un admin)
export const statsRouter = Router();

statsRouter.use(requireAuth, requireRole('author', 'admin'));

statsRouter.get('/books/:id/summary', validate(statsBookIdParamSchema, 'params'), asyncHandler(statsController.getBookStatsSummaryHandler));
statsRouter.get('/books/:id/views', validate(statsBookIdParamSchema, 'params'), validate(viewStatsQuerySchema, 'query'), asyncHandler(statsController.getBookViewStatsHandler));

statsRouter.get('/books/:id/summary', (_req, res) => {
  res.status(501).json({ success: false, message: 'Non implémenté : GET /stats/books/:id/summary' });
});
