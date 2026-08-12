import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

const partSelect = { id: true, title: true, partNumber: true, price: true, isFree: true, book: { select: { id: true, title: true, slug: true, cover: true } } } as const;

export async function listCart(userId: number) {
  return prisma.cart.findMany({ where: { userId, partId: { not: null } }, include: { part: { select: partSelect } }, orderBy: { createdAt: 'desc' } });
}

export async function addPartToCart(userId: number, partId: number) {
  const part = await prisma.bookPart.findUnique({ where: { id: partId }, select: { id: true, bookId: true, isFree: true } });
  if (!part) throw ApiError.notFound('Partie introuvable');
  if (part.isFree) throw ApiError.badRequest('Cette partie est déjà gratuite');

  const [purchase, existing] = await Promise.all([
    prisma.achat.findFirst({ where: { userId, partId }, select: { id: true } }),
    prisma.cart.findFirst({ where: { userId, partId }, select: { id: true } }),
  ]);
  if (purchase) throw ApiError.conflict('Vous possédez déjà cette partie');
  if (existing) return existing;

  return prisma.cart.create({ data: { userId, bookId: part.bookId, partId, quantity: 1 } });
}

export async function removePartFromCart(userId: number, partId: number) {
  await prisma.cart.deleteMany({ where: { userId, partId } });
}
