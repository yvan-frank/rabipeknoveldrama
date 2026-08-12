import type { Request, Response } from 'express';
import * as cartService from './cart.service';

export async function listCartHandler(req: Request, res: Response) {
  const cart = await cartService.listCart(req.user!.id);
  res.json({ success: true, data: cart });
}

export async function addPartToCartHandler(req: Request, res: Response) {
  const item = await cartService.addPartToCart(req.user!.id, req.body.partId);
  res.status(201).json({ success: true, data: item });
}

export async function removePartFromCartHandler(req: Request, res: Response) {
  const { partId } = req.params as unknown as { partId: number };
  await cartService.removePartFromCart(req.user!.id, partId);
  res.status(204).send();
}
