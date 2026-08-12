import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { bookIdParamSchema } from './likes.schema';
import * as likesController from './likes.controller';

export const likesRouter = Router();

likesRouter.post(
  '/books/:bookId',
  requireAuth,
  validate(bookIdParamSchema, 'params'),
  asyncHandler(likesController.toggleBookLikeHandler),
);
