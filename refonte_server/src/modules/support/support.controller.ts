import type { Request, Response } from 'express';
import * as supportService from './support.service';

export async function getMyMessagesHandler(req: Request, res: Response) {
  const messages = await supportService.getMyMessages(req.user!.id);
  res.json({ success: true, data: { messages } });
}

export async function getUnreadCountHandler(req: Request, res: Response) {
  const unreadCount = await supportService.getUnreadCountForUser(req.user!.id);
  res.json({ success: true, data: { unreadCount } });
}

export async function sendMessageAsUserHandler(req: Request, res: Response) {
  const { content } = req.body as { content: string };
  const message = await supportService.sendMessageAsUser(req.user!.id, content);
  res.status(201).json({ success: true, data: message });
}

export async function listConversationsForAdminHandler(_req: Request, res: Response) {
  const conversations = await supportService.listConversationsForAdmin();
  res.json({ success: true, data: { conversations } });
}

export async function getConversationForAdminHandler(req: Request, res: Response) {
  const { userId } = req.params as unknown as { userId: number };
  const conversation = await supportService.getConversationForAdmin(userId);
  res.json({ success: true, data: conversation });
}

export async function sendMessageAsAdminHandler(req: Request, res: Response) {
  const { userId } = req.params as unknown as { userId: number };
  const { content } = req.body as { content: string };
  const message = await supportService.sendMessageAsAdmin(userId, content);
  res.status(201).json({ success: true, data: message });
}
