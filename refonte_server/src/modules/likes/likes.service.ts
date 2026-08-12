import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export async function toggleBookLike(bookId: number, userId: number) {
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
  if (!book) {
    throw ApiError.notFound('Livre introuvable');
  }

  const existing = await prisma.like.findUnique({
    where: { bookId_userId: { bookId, userId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { bookId, userId } });
  }

  const likeCount = await prisma.like.count({ where: { bookId } });

  return { liked: !existing, likeCount };
}
