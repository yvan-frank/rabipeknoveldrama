"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookStatsSummary = getBookStatsSummary;
exports.getBookViewStats = getBookViewStats;
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
const ownership_1 = require("../../utils/ownership");
async function assertStatsAccess(bookId, user) {
    const book = await prisma_1.prisma.book.findUnique({ where: { id: bookId }, select: { id: true, authorId: true } });
    if (!book)
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    (0, ownership_1.assertAuthorOwnership)(user, book.authorId);
}
async function getBookStatsSummary(bookId, user) {
    await assertStatsAccess(bookId, user);
    const [views, events, reads, likes, shares, purchases] = await Promise.all([
        prisma_1.prisma.viewBooks.findUnique({ where: { bookId }, select: { viewCount: true } }),
        prisma_1.prisma.bookViewEvent.count({ where: { bookId } }),
        prisma_1.prisma.readBook.count({ where: { bookId } }),
        prisma_1.prisma.like.count({ where: { bookId } }),
        prisma_1.prisma.share.count({ where: { bookId } }),
        prisma_1.prisma.achat.aggregate({ where: { bookId, isFree: false }, _count: true, _sum: { price: true } }),
    ]);
    return { totalViews: views?.viewCount ?? 0, uniqueTrackedViews: events, reads, likes, shares, purchases: purchases._count, revenue: purchases._sum.price ?? 0 };
}
async function getBookViewStats(bookId, query, user) {
    await assertStatsAccess(bookId, user);
    const viewedAt = { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) };
    const where = { bookId, ...(Object.keys(viewedAt).length ? { viewedAt } : {}) };
    if (query.groupBy === 'day') {
        const viewDate = { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) };
        return prisma_1.prisma.viewPerDay.findMany({ where: { bookId, ...(Object.keys(viewDate).length ? { viewDate } : {}) }, select: { viewDate: true, views: true }, orderBy: { viewDate: 'asc' } });
    }
    if (query.groupBy === 'country')
        return prisma_1.prisma.bookViewEvent.groupBy({ by: ['country'], where, _count: { _all: true }, orderBy: { _count: { country: 'desc' } } });
    return prisma_1.prisma.bookViewEvent.groupBy({ by: ['platform'], where, _count: { _all: true }, orderBy: { _count: { platform: 'desc' } } });
}
//# sourceMappingURL=stats.service.js.map