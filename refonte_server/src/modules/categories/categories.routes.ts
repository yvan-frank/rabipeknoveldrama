import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as categoriesController from './categories.controller';

// Lecture publique uniquement pour l'instant (alimente le filtrage du
// catalogue) — écriture (CRUD complet) laissée en TODO, pas de besoin
// identifié côté frontend à ce stade.
export const categoriesRouter = Router();

categoriesRouter.get('/', asyncHandler(categoriesController.listCategoriesHandler));
