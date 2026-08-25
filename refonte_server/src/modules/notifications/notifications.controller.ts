import type { Request, Response } from 'express';
import * as notificationsService from './notifications.service';

export async function registerPushTokenHandler(req: Request, res: Response) {
  const { token } = req.body as { token: string };
  await notificationsService.registerPushToken(req.user!.id, token);
  res.json({ success: true, data: null });
}

export async function unregisterPushTokenHandler(req: Request, res: Response) {
  const { token } = req.body as { token: string };
  await notificationsService.unregisterPushToken(req.user!.id, token);
  res.json({ success: true, data: null });
}
