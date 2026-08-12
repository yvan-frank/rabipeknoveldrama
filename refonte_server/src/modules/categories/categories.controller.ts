import type { Request, Response } from 'express';
import * as categoriesService from './categories.service';

export async function listCategoriesHandler(_req: Request, res: Response) {
  const categories = await categoriesService.listCategories();
  res.json({ success: true, data: categories });
}
