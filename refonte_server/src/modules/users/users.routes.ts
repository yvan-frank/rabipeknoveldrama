import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { bookGrantIdParamSchema, grantBookSchema, listUsersQuerySchema, userIdParamSchema } from './users.schema';
import * as usersController from './users.controller';

export const usersRouter = Router();

usersRouter.get('/moi/tableau-de-bord', requireAuth, requireRole('user'), asyncHandler(usersController.getMyDashboardHandler));
usersRouter.get('/administration/tableau-de-bord', requireAuth, requireRole('admin'), asyncHandler(usersController.getAdminDashboardHandler));

usersRouter.use(requireAuth, requireRole('admin'));

usersRouter.get('/', validate(listUsersQuerySchema, 'query'), asyncHandler(usersController.listUsersHandler));
usersRouter.get('/book-grants', validate(listUsersQuerySchema, 'query'), asyncHandler(usersController.listBookGrantsHandler));
usersRouter.delete('/book-grants/:grantId', validate(bookGrantIdParamSchema, 'params'), asyncHandler(usersController.revokeBookGrantHandler));
usersRouter.post(
  '/:id/book-grants',
  validate(userIdParamSchema, 'params'),
  validate(grantBookSchema),
  asyncHandler(usersController.grantBookHandler),
);
usersRouter.get('/:id', validate(userIdParamSchema, 'params'), asyncHandler(usersController.getUserHandler));
usersRouter.delete('/:id', validate(userIdParamSchema, 'params'), asyncHandler(usersController.deleteUserHandler));
