import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';

export async function uploadCoverHandler(req: Request, res: Response) {
  if (!req.file) {
    throw ApiError.badRequest('Aucune image reçue');
  }

  const url = `${env.APP_URL}/uploads/covers/${req.file.filename}`;
  res.status(201).json({ success: true, data: { url } });
}

export async function uploadDocumentHandler(req: Request, res: Response) {
  if (!req.file) {
    throw ApiError.badRequest('Aucun document reçu');
  }

  const url = `${env.APP_URL}/uploads/documents/${req.file.filename}`;
  res.status(201).json({ success: true, data: { url } });
}
