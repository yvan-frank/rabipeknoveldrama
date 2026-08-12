import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { assertAuthorOwnership } from '../../utils/ownership';
import type { AuthUser } from '../auth/auth.types';
import type { ViewStatsQuery } from './stats.schema';

async function assertStatsAccess(bookId: number, user: AuthUser) {
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true, authorId: true } });
  if (!book) throw ApiError.notFound('Livre introuvable');
  assertAuthorOwnership(user, book.authorId);
}

export async function getBookStatsSummary(bookId: number, user: AuthUser) {
  await assertStatsAccess(bookId, user);
  const [views, events, reads, likes, shares, purchases] = await Promise.all([
    prisma.viewBooks.findUnique({ where: { bookId }, select: { viewCount: true } }),
    prisma.bookViewEvent.count({ where: { bookId } }),
    prisma.readBook.count({ where: { bookId } }),
    prisma.like.count({ where: { bookId } }),
    prisma.share.count({ where: { bookId } }),
    prisma.achat.aggregate({ where: { bookId, isFree: false }, _count: true, _sum: { price: true } }),
  ]);
  return { totalViews: views?.viewCount ?? 0, uniqueTrackedViews: events, reads, likes, shares, purchases: purchases._count, revenue: purchases._sum.price ?? 0 };
}

export async function getBookViewStats(bookId: number, query: ViewStatsQuery, user: AuthUser) {
  await assertStatsAccess(bookId, user);
  const viewedAt = { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) };
  const where = { bookId, ...(Object.keys(viewedAt).length ? { viewedAt } : {}) };
  if (query.groupBy === 'day') {
    const viewDate = { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) };
    return prisma.viewPerDay.findMany({ where: { bookId, ...(Object.keys(viewDate).length ? { viewDate } : {}) }, select: { viewDate: true, views: true }, orderBy: { viewDate: 'asc' } });
  }
  if (query.groupBy === 'country') return prisma.bookViewEvent.groupBy({ by: ['country'], where, _count: { _all: true }, orderBy: { _count: { country: 'desc' } } });
  return prisma.bookViewEvent.groupBy({ by: ['platform'], where, _count: { _all: true }, orderBy: { _count: { platform: 'desc' } } });
}
