import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { requireAuthorKyc } from '../../middlewares/authorKyc.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { bookIdParamSchema } from '../chapters/chapters.schema';
import { bookPartIdParamSchema, createBookPartSchema, updateBookPartSchema } from './book-parts.schema';
import * as bookPartsController from './book-parts.controller';

export const bookPartsRouter = Router();

bookPartsRouter.get('/book/:bookId', validate(bookIdParamSchema, 'params'), asyncHandler(bookPartsController.listBookPartsHandler));

bookPartsRouter.post('/', requireAuth, requireRole('author', 'admin'), requireAuthorKyc, validate(createBookPartSchema), asyncHandler(bookPartsController.createBookPartHandler));
bookPartsRouter.patch('/:id', requireAuth, requireRole('author', 'admin'), requireAuthorKyc, validate(bookPartIdParamSchema, 'params'), validate(updateBookPartSchema), asyncHandler(bookPartsController.updateBookPartHandler));
bookPartsRouter.delete('/:id', requireAuth, requireRole('author', 'admin'), requireAuthorKyc, validate(bookPartIdParamSchema, 'params'), asyncHandler(bookPartsController.deleteBookPartHandler));
