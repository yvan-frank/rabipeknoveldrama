import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { addReadingTimeSchema, articleIdParamSchema, listTransactionsQuerySchema } from './points.schema';
import * as pointsController from './points.controller';

export const pointsRouter = Router();

pointsRouter.get('/balance', requireAuth, asyncHandler(pointsController.getBalanceHandler));

pointsRouter.get(
  '/transactions',
  requireAuth,
  validate(listTransactionsQuerySchema, 'query'),
  asyncHandler(pointsController.listTransactionsHandler),
);

pointsRouter.get('/earn/rewarded-ad', requireAuth, asyncHandler(pointsController.getRewardedAdStatusHandler));

pointsRouter.post('/earn/rewarded-ad', requireAuth, asyncHandler(pointsController.creditRewardedAdHandler));

pointsRouter.get('/checkin', requireAuth, asyncHandler(pointsController.getCheckInStatusHandler));

pointsRouter.post('/checkin', requireAuth, asyncHandler(pointsController.performCheckInHandler));

pointsRouter.get('/articles', requireAuth, asyncHandler(pointsController.getArticlesStatusHandler));

pointsRouter.post(
  '/articles/:articleId/read',
  requireAuth,
  validate(articleIdParamSchema, 'params'),
  asyncHandler(pointsController.markArticleReadHandler),
);

pointsRouter.get('/reading-time', requireAuth, asyncHandler(pointsController.getReadingTimeStatusHandler));

pointsRouter.post(
  '/reading-time',
  requireAuth,
  validate(addReadingTimeSchema, 'body'),
  asyncHandler(pointsController.addReadingTimeHandler),
);
