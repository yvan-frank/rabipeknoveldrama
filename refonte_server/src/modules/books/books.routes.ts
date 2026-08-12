import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { optionalAuth, requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { requireAuthorKyc } from '../../middlewares/authorKyc.middleware';
import {
  bookIdParamSchema,
  bookSlugParamSchema,
  createBookSchema,
  deleteBookSchema,
  grantBookToEmailSchema,
  moderateBookSchema,
  listBooksQuerySchema,
  topRatedBooksQuerySchema,
  updateBookSchema,
} from './books.schema';
import * as booksController from './books.controller';

export const booksRouter = Router();

booksRouter.get('/', validate(listBooksQuerySchema, 'query'), asyncHandler(booksController.listBooksHandler));

// Chemin à un seul segment comme `/mine` ci-dessous : doit précéder `/:slug`
// pour ne pas en être capturé (Express matche dans l'ordre de déclaration).
booksRouter.get(
  '/top-rated',
  validate(topRatedBooksQuerySchema, 'query'),
  asyncHandler(booksController.getTopRatedBooksHandler),
);

booksRouter.post(
  '/:id/grants',
  requireAuth,
  requireRole('author', 'admin'),
  requireAuthorKyc,
  validate(bookIdParamSchema, 'params'),
  validate(grantBookToEmailSchema),
  asyncHandler(booksController.grantBookToReaderHandler),
);

booksRouter.get('/administration/catalogue', requireAuth, requireRole('admin'), asyncHandler(booksController.listBooksForAdminHandler));
booksRouter.patch('/:id/moderation', requireAuth, requireRole('admin'), validate(bookIdParamSchema, 'params'), validate(moderateBookSchema), asyncHandler(booksController.moderateBookHandler));

// Espace auteur : mes livres + détail par id pour édition — chemins à deux
// segments, donc jamais capturés par `/:slug` ci-dessous (un seul segment).
booksRouter.get('/mine', requireAuth, requireRole('author', 'admin'), asyncHandler(booksController.listMyBooksHandler));

booksRouter.get(
  '/manage/:id',
  requireAuth,
  requireRole('author', 'admin'),
  validate(bookIdParamSchema, 'params'),
  asyncHandler(booksController.getBookForManageHandler),
);

// Détail public par slug (SEO) — distinct des routes /:id ci-dessous, qui
// restent en identifiant numérique pour les actions internes authentifiées
// (update/delete), inchangées par le passage aux URLs nominatives.
booksRouter.get(
  '/:slug',
  optionalAuth,
  validate(bookSlugParamSchema, 'params'),
  asyncHandler(booksController.getBookHandler),
);

booksRouter.post(
  '/',
  requireAuth,
  requireRole('author', 'admin'),
  requireAuthorKyc,
  validate(createBookSchema),
  asyncHandler(booksController.createBookHandler),
);

booksRouter.patch(
  '/:id',
  requireAuth,
  requireRole('author', 'admin'),
  requireAuthorKyc,
  validate(bookIdParamSchema, 'params'),
  validate(updateBookSchema),
  asyncHandler(booksController.updateBookHandler),
);

booksRouter.delete(
  '/:id',
  requireAuth,
  requireRole('author', 'admin'),
  requireAuthorKyc,
  validate(bookIdParamSchema, 'params'),
  validate(deleteBookSchema),
  asyncHandler(booksController.deleteBookHandler),
);
