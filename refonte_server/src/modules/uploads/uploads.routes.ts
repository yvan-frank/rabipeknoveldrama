import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { uploadCoverImage, uploadIdentityDocument } from '../../middlewares/upload.middleware';
import * as uploadsController from './uploads.controller';

export const uploadsRouter = Router();

// Upload découplé de la création du livre : le formulaire (assistant en
// plusieurs étapes) envoie l'image dès sa sélection et récupère une URL,
// utilisée ensuite comme n'importe quel champ `cover` texte lors de POST/PATCH /books.
uploadsRouter.post(
  '/cover',
  requireAuth,
  requireRole('author', 'admin'),
  uploadCoverImage,
  asyncHandler(uploadsController.uploadCoverHandler),
);

// Sciemment PAS gardé par requireAuthorKyc : c'est justement l'upload de la
// pièce d'identité qui permet de compléter le KYC.
uploadsRouter.post(
  '/document',
  requireAuth,
  requireRole('author', 'admin'),
  uploadIdentityDocument,
  asyncHandler(uploadsController.uploadDocumentHandler),
);
