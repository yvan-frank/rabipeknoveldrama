import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { sendSupportMessageSchema, supportUserIdParamSchema } from './support.schema';
import * as supportController from './support.controller';

export const supportRouter = Router();

supportRouter.get('/messages', requireAuth, asyncHandler(supportController.getMyMessagesHandler));

supportRouter.get('/messages/unread-count', requireAuth, asyncHandler(supportController.getUnreadCountHandler));

supportRouter.post(
  '/messages',
  requireAuth,
  validate(sendSupportMessageSchema, 'body'),
  asyncHandler(supportController.sendMessageAsUserHandler),
);

// -- Administration (même convention d'URL que users/books, cf. leurs routes) --

supportRouter.get(
  '/administration/conversations',
  requireAuth,
  requireRole('admin'),
  asyncHandler(supportController.listConversationsForAdminHandler),
);

supportRouter.get(
  '/administration/conversations/:userId',
  requireAuth,
  requireRole('admin'),
  validate(supportUserIdParamSchema, 'params'),
  asyncHandler(supportController.getConversationForAdminHandler),
);

supportRouter.post(
  '/administration/conversations/:userId/messages',
  requireAuth,
  requireRole('admin'),
  validate(supportUserIdParamSchema, 'params'),
  validate(sendSupportMessageSchema, 'body'),
  asyncHandler(supportController.sendMessageAsAdminHandler),
);
