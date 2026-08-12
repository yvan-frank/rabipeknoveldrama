import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate.middleware';
import { addPartToCartSchema, cartPartIdParamSchema } from './cart.schema';
import * as cartController from './cart.controller';

// TODO: suivre le pattern auth/users. Toutes les routes nécessitent requireAuth
// (le panier est toujours celui de req.user.id, jamais un id_user passé en paramètre).
//   GET    /            panier de l'utilisateur connecté
//   POST   /            ajouter un livre au panier
//   DELETE /:bookId      retirer un livre
//   DELETE /            vider le panier
export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get('/', asyncHandler(cartController.listCartHandler));
cartRouter.post('/', validate(addPartToCartSchema), asyncHandler(cartController.addPartToCartHandler));
cartRouter.delete('/parties/:partId', validate(cartPartIdParamSchema, 'params'), asyncHandler(cartController.removePartFromCartHandler));
