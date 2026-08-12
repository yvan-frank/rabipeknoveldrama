import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

// Valide et remplace req[target] par la version parsée (types coercés, champs
// inconnus retirés) : les controllers reçoivent toujours une donnée propre.
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    req[target] = schema.parse(req[target]);
    next();
  };
}
