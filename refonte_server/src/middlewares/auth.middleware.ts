import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import type { AuthUser } from '../modules/auth/auth.types';

// Auth stateless uniquement (JWT signé, pas de table `sessions` côté DB —
// décision prise pour lever l'incohérence "double stratégie d'auth" du legacy).
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;

  if (!token) {
    throw ApiError.unauthorized();
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    next();
  } catch {
    throw ApiError.unauthorized('Session invalide ou expirée');
  }
}

// Pour les routes publiques qui personnalisent leur réponse si l'appelant
// est connecté (ex. isLikedByUser sur un livre) sans exiger d'authentification.
// Un cookie absent ou invalide n'est pas une erreur ici, contrairement à
// requireAuth — on continue simplement sans req.user.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;

  if (token) {
    try {
      req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    } catch {
      // Token invalide/expiré : on ignore, la route reste accessible en anonyme.
    }
  }

  next();
}

export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden();
    }
    next();
  };
}
