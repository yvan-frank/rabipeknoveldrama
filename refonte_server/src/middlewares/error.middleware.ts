import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { logger } from '../lib/logger';
import { isProduction } from '../config/env';

// IMPORTANT : ce middleware doit être enregistré en DERNIER, après toutes les
// routes (Express n'invoque un error-middleware que pour les erreurs passées
// via next(err) et seulement s'il est déclaré après le code qui peut échouer —
// c'est le bug qu'on corrige par rapport à l'ancien app.js).
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation échouée',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, 'Erreur non gérée');

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    ...(isProduction ? {} : { stack: (err as Error)?.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
  });
}
