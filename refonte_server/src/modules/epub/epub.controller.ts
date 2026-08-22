import type { Request, Response } from 'express';
import * as epubService from './epub.service';
import { queueEpubGeneration } from './epub.worker';

export async function createEpubEditionHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const edition = await epubService.requestEpubGeneration(id, req.user!);
  queueEpubGeneration(edition.id);
  res.status(202).json({ success: true, data: edition });
}

export async function listEpubEditionsHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const editions = await epubService.listEpubEditions(id, req.user!);
  res.json({ success: true, data: editions });
}

export async function downloadEpubEditionHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const file = await epubService.getEpubDownload(id, req.user!);
  res.download(file.filePath, file.filename, { headers: { 'Content-Type': 'application/epub+zip' } });
}
