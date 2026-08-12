import type { Request, Response } from 'express';
import * as booksService from './books.service';
import type { ListBooksQuery, TopRatedBooksQuery } from './books.schema';

export async function listBooksHandler(req: Request, res: Response) {
  const result = await booksService.listBooks(req.query as unknown as ListBooksQuery);
  res.json({ success: true, data: result });
}

export async function getTopRatedBooksHandler(req: Request, res: Response) {
  const { limit } = req.query as unknown as TopRatedBooksQuery;
  const books = await booksService.getTopRatedBooks(limit);
  res.json({ success: true, data: books });
}

export async function getBookHandler(req: Request, res: Response) {
  const { slug } = req.params as unknown as { slug: string };
  const countryHeader = req.get('cf-ipcountry') ?? req.get('x-vercel-ip-country') ?? undefined;
  const book = await booksService.getBookDetailForViewer(slug, req.user?.id, {
    userId: req.user?.id,
    ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
    userAgent: req.get('user-agent') ?? undefined,
    country: countryHeader,
  });
  res.json({ success: true, data: book });
}

export async function listMyBooksHandler(req: Request, res: Response) {
  const books = await booksService.listMyBooks(req.user!);
  res.json({ success: true, data: books });
}

export async function listBooksForAdminHandler(_req: Request, res: Response) { res.json({ success: true, data: await booksService.listBooksForAdmin() }); }
export async function moderateBookHandler(req: Request, res: Response) { const { id } = req.params as unknown as { id: number }; const { action } = req.body as { action: 'publish' | 'unpublish' | 'block' | 'suspend' | 'delete' }; const book = await booksService.moderateBook(id, action); res.json({ success: true, data: book }); }

export async function getBookForManageHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const book = await booksService.getBookForManage(id, req.user!);
  res.json({ success: true, data: book });
}

export async function grantBookToReaderHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const grant = await booksService.grantBookToReader(id, req.body as { email: string; note?: string }, req.user!);
  res.status(201).json({ success: true, data: grant });
}

export async function createBookHandler(req: Request, res: Response) {
  const book = await booksService.createBook(req.body, req.user!);
  res.status(201).json({ success: true, data: book });
}

export async function updateBookHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const book = await booksService.updateBook(id, req.body, req.user!);
  res.json({ success: true, data: book });
}

export async function deleteBookHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  await booksService.deleteBook(id, req.user!);
  res.status(204).send();
}
