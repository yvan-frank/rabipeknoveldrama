import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { pushTokenBodySchema } from './notifications.schema';
import * as notificationsController from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.post(
  '/push-token',
  requireAuth,
  validate(pushTokenBodySchema, 'body'),
  asyncHandler(notificationsController.registerPushTokenHandler),
);

notificationsRouter.delete(
  '/push-token',
  requireAuth,
  validate(pushTokenBodySchema, 'body'),
  asyncHandler(notificationsController.unregisterPushTokenHandler),
);
