import type { Request, Response } from 'express';
import * as likesService from './likes.service';

export async function toggleBookLikeHandler(req: Request, res: Response) {
  const { bookId } = req.params as unknown as { bookId: number };
  const result = await likesService.toggleBookLike(bookId, req.user!.id);
  res.json({ success: true, data: result });
}
