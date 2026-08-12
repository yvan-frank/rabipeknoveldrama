import type { Request, Response } from 'express';
import { env, isProduction } from '../../config/env';
import * as authService from './auth.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function registerHandler(req: Request, res: Response) {
  const { user, token } = await authService.register(req.body);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(201).json({ success: true, data: { user } });
}

export async function registerAuthorHandler(req: Request, res: Response) {
  const { user, token } = await authService.registerAuthor(req.body);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(201).json({ success: true, data: { user } });
}

export async function loginHandler(req: Request, res: Response) {
  const { user, token } = await authService.login(req.body);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.json({ success: true, data: { user } });
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie(env.COOKIE_NAME);
  res.json({ success: true, data: null });
}

export function meHandler(req: Request, res: Response) {
  res.json({ success: true, data: { user: req.user } });
}
