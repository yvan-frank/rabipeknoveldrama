import type { Request, Response } from 'express';
import * as statsService from './stats.service';
import type { ViewStatsQuery } from './stats.schema';

export async function getBookStatsSummaryHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  res.json({ success: true, data: await statsService.getBookStatsSummary(id, req.user!) });
}

export async function getBookViewStatsHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  res.json({ success: true, data: await statsService.getBookViewStats(id, req.query as unknown as ViewStatsQuery, req.user!) });
}
