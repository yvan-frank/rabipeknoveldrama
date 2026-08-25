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
  const { user, token, accessToken, refreshToken } = await authService.register(req.body);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
}

export async function registerAuthorHandler(req: Request, res: Response) {
  const { user, token, accessToken, refreshToken } = await authService.registerAuthor(req.body);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
}

export async function loginHandler(req: Request, res: Response) {
  const { user, token, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  res.json({ success: true, data: { user, accessToken, refreshToken } });
}

// L'app mobile n'a pas de cookie à effacer : elle envoie son refresh token
// pour qu'il soit révoqué côté serveur (sinon il resterait échangeable).
export async function logoutHandler(req: Request, res: Response) {
  const refreshToken = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  if (refreshToken) {
    await authService.revokeRefreshToken(refreshToken);
  }
  res.clearCookie(env.COOKIE_NAME);
  res.json({ success: true, data: null });
}

export async function refreshHandler(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.refreshAccessToken(req.body.refreshToken);
  res.json({ success: true, data: { user, accessToken, refreshToken } });
}

export function meHandler(req: Request, res: Response) {
  res.json({ success: true, data: { user: req.user } });
}
