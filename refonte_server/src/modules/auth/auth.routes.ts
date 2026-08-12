import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { loginSchema, registerSchema, registerAuthorSchema } from './auth.schema';
import * as authController from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), asyncHandler(authController.registerHandler));
authRouter.post(
  '/register-author',
  validate(registerAuthorSchema),
  asyncHandler(authController.registerAuthorHandler),
);
authRouter.post('/login', validate(loginSchema), asyncHandler(authController.loginHandler));
authRouter.post('/logout', authController.logoutHandler);
authRouter.get('/me', requireAuth, authController.meHandler);
