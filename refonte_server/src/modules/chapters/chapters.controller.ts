import type { Request, Response } from 'express';
import * as chaptersService from './chapters.service';

export async function listChaptersByBookHandler(req: Request, res: Response) {
  const { bookId } = req.params as unknown as { bookId: number };
  const chapters = await chaptersService.listChaptersByBook(bookId);
  res.json({ success: true, data: chapters });
}

export async function getChapterHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
  const chapter = await chaptersService.getChapterForViewer(id, viewer);
  res.json({ success: true, data: chapter });
}

export async function getChapterForManageHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const chapter = await chaptersService.getChapterForManage(id, req.user!);
  res.json({ success: true, data: chapter });
}

export async function createChapterHandler(req: Request, res: Response) {
  const chapter = await chaptersService.createChapter(req.body, req.user!);
  res.status(201).json({ success: true, data: chapter });
}

export async function updateChapterHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const chapter = await chaptersService.updateChapter(id, req.body, req.user!);
  res.json({ success: true, data: chapter });
}

export async function deleteChapterHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  await chaptersService.deleteChapter(id, req.user!);
  res.status(204).send();
}
