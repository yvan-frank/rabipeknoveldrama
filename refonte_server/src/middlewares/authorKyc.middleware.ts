import type { NextFunction, Request, Response } from 'express';
import { assertAuthorKycComplete } from '../modules/authors/authors.service';

// Bloque les actions d'écriture (création/modification/suppression de livres
// et chapitres) tant qu'un auteur n'a pas complété son KYC — cf. demande :
// "avant de faire quoi que ce soit dans le système, le kyc doit être vérifié".
// Un admin n'est jamais concerné (rôle différent) ; un rôle 'user' n'atteint
// jamais ces routes (déjà bloqué par requireRole('author','admin') en amont).
export async function requireAuthorKyc(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'author') {
    next();
    return;
  }

  try {
    await assertAuthorKycComplete(req.user.authorId!);
    next();
  } catch (err) {
    next(err);
  }
}
