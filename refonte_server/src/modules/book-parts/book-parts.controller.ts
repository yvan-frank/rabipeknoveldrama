import type { Request, Response } from 'express';
import * as bookPartsService from './book-parts.service';

export async function listBookPartsHandler(req: Request, res: Response) {
  const bookId = Number(req.params.bookId);
  const parts = await bookPartsService.listBookParts(bookId);
  res.json({ success: true, data: parts });
}

export async function createBookPartHandler(req: Request, res: Response) {
  const part = await bookPartsService.createBookPart(req.body, req.user!);
  res.status(201).json({ success: true, data: part });
}

export async function updateBookPartHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const part = await bookPartsService.updateBookPart(id, req.body, req.user!);
  res.json({ success: true, data: part });
}

export async function deleteBookPartHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  await bookPartsService.deleteBookPart(id, req.user!);
  res.status(204).send();
}
