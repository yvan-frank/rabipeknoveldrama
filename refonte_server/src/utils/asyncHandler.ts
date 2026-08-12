import type { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Évite d'avoir un try/catch dans chaque controller : toute rejection
// de promesse est transmise à `next()` et attrapée par errorHandler.
export const asyncHandler =
  (handler: AsyncRouteHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
