import type { Request, Response } from 'express';
import * as commentsService from './comments.service';

export async function listBookReviewsHandler(req: Request, res: Response) {
  const { bookId } = req.params as unknown as { bookId: number };
  const reviews = await commentsService.listBookReviews(bookId);
  res.json({ success: true, data: reviews });
}

export async function upsertBookReviewHandler(req: Request, res: Response) {
  const { bookId } = req.params as unknown as { bookId: number };
  const review = await commentsService.upsertBookReview(bookId, req.user!.id, req.body);
  res.status(201).json({ success: true, data: review });
}

export async function replyToBookReviewHandler(req: Request, res: Response) {
  const { commentId } = req.params as unknown as { commentId: number };
  const reply = await commentsService.replyToBookReview(commentId, req.body.content as string, req.user!);
  res.json({ success: true, data: reply });
}

export async function listChapterCommentsHandler(req: Request, res: Response) {
  const { chapterId } = req.params as unknown as { chapterId: number };
  const comments = await commentsService.listChapterComments(chapterId);
  res.json({ success: true, data: comments });
}

export async function createChapterCommentHandler(req: Request, res: Response) {
  const { chapterId } = req.params as unknown as { chapterId: number };
  const comment = await commentsService.createChapterComment(chapterId, req.user!.id, req.body);
  res.status(201).json({ success: true, data: comment });
}
