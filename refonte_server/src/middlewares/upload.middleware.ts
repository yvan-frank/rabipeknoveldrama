import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

const COVER_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'covers');
const DOCUMENT_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');
fs.mkdirSync(COVER_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DOCUMENT_UPLOAD_DIR, { recursive: true });

const IMAGE_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Pièce d'identité (KYC auteur) : mêmes formats image, plus PDF pour un scan.
const DOCUMENT_MIME_TYPES: Record<string, string> = {
  ...IMAGE_MIME_TYPES,
  'application/pdf': 'pdf',
};

function makeStorage(dir: string, mimeTypes: Record<string, string>) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = mimeTypes[file.mimetype] ?? 'bin';
      cb(null, `${crypto.randomUUID()}.${ext}`);
    },
  });
}

const coverUpload = multer({
  storage: makeStorage(COVER_UPLOAD_DIR, IMAGE_MIME_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME_TYPES[file.mimetype]) {
      cb(new Error('UNSUPPORTED_TYPE'));
      return;
    }
    cb(null, true);
  },
});

const documentUpload = multer({
  storage: makeStorage(DOCUMENT_UPLOAD_DIR, DOCUMENT_MIME_TYPES),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!DOCUMENT_MIME_TYPES[file.mimetype]) {
      cb(new Error('UNSUPPORTED_TYPE'));
      return;
    }
    cb(null, true);
  },
});

// Multer signale ses erreurs via un callback plutôt qu'une exception —
// on les traduit ici en ApiError pour un message cohérent avec le reste de l'API.
export function uploadCoverImage(req: Request, res: Response, next: NextFunction) {
  coverUpload.single('cover')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      next(ApiError.badRequest('Image trop volumineuse (5 Mo maximum)'));
      return;
    }
    if (err instanceof Error && err.message === 'UNSUPPORTED_TYPE') {
      next(ApiError.badRequest("Format d'image non supporté (jpg, png ou webp uniquement)"));
      return;
    }
    if (err) {
      next(err);
      return;
    }
    next();
  });
}

export function uploadIdentityDocument(req: Request, res: Response, next: NextFunction) {
  documentUpload.single('document')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      next(ApiError.badRequest('Fichier trop volumineux (8 Mo maximum)'));
      return;
    }
    if (err instanceof Error && err.message === 'UNSUPPORTED_TYPE') {
      next(ApiError.badRequest('Format non supporté (jpg, png, webp ou pdf uniquement)'));
      return;
    }
    if (err) {
      next(err);
      return;
    }
    next();
  });
}
