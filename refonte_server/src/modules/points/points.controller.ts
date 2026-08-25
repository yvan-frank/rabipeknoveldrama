import type { Request, Response } from 'express';
import * as pointsService from './points.service';

export async function getBalanceHandler(req: Request, res: Response) {
  const result = await pointsService.getBalance(req.user!.id);
  res.json({ success: true, data: result });
}

export async function listTransactionsHandler(req: Request, res: Response) {
  const { limit } = req.query as unknown as { limit: number };
  const result = await pointsService.listTransactions(req.user!.id, limit);
  res.json({ success: true, data: result });
}

export async function creditRewardedAdHandler(req: Request, res: Response) {
  const result = await pointsService.creditRewardedAd(req.user!.id);
  res.json({ success: true, data: result });
}

export async function getRewardedAdStatusHandler(req: Request, res: Response) {
  const result = await pointsService.getRewardedAdStatus(req.user!.id);
  res.json({ success: true, data: result });
}

export async function getCheckInStatusHandler(req: Request, res: Response) {
  const result = await pointsService.getCheckInStatus(req.user!.id);
  res.json({ success: true, data: result });
}

export async function performCheckInHandler(req: Request, res: Response) {
  const result = await pointsService.performCheckIn(req.user!.id);
  res.json({ success: true, data: result });
}

export async function getArticlesStatusHandler(req: Request, res: Response) {
  const result = await pointsService.getArticlesStatus(req.user!.id);
  res.json({ success: true, data: result });
}

export async function markArticleReadHandler(req: Request, res: Response) {
  const { articleId } = req.params as unknown as { articleId: 'article-1' | 'article-2' | 'article-3' };
  const result = await pointsService.markArticleRead(req.user!.id, articleId);
  res.json({ success: true, data: result });
}

export async function getReadingTimeStatusHandler(req: Request, res: Response) {
  const result = await pointsService.getReadingTimeStatus(req.user!.id);
  res.json({ success: true, data: result });
}

export async function addReadingTimeHandler(req: Request, res: Response) {
  const { seconds } = req.body as { seconds: number };
  const result = await pointsService.addReadingTime(req.user!.id, seconds);
  res.json({ success: true, data: result });
}
