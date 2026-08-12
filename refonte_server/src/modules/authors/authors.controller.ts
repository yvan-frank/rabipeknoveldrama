import type { Request, Response } from 'express';
import * as authorsService from './authors.service';

export async function getMyKycHandler(req: Request, res: Response) {
  const result = await authorsService.getMyKyc(req.user!.authorId!);
  res.json({ success: true, data: result });
}

export async function submitKycHandler(req: Request, res: Response) {
  const extension = await authorsService.submitKyc(req.user!.authorId!, req.body);
  res.json({ success: true, data: extension });
}

export async function listAuthorsForKycReviewHandler(_req: Request, res: Response) {
  const authors = await authorsService.listAuthorsForKycReview();
  res.json({ success: true, data: authors });
}

export async function setAuthorKycVerificationHandler(req: Request, res: Response) {
  const { authorId } = req.params as unknown as { authorId: number };
  const { verified } = req.body as { verified: boolean };
  const extension = await authorsService.setAuthorKycVerification(authorId, verified);
  res.json({ success: true, data: extension });
}

export async function getAuthorKycBypassPolicyHandler(_req: Request, res: Response) {
  const policy = await authorsService.getAuthorKycBypassPolicy();
  res.json({ success: true, data: policy });
}

export async function setAuthorKycBypassPolicyHandler(req: Request, res: Response) {
  const { enabled } = req.body as { enabled: boolean };
  const policy = await authorsService.setAuthorKycBypassPolicy(enabled);
  res.json({ success: true, data: policy });
}
