"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackBookView = trackBookView;
const node_crypto_1 = require("node:crypto");
const prisma_1 = require("../../lib/prisma");
const env_1 = require("../../config/env");
const DEDUPLICATION_WINDOW_MS = 30 * 60 * 1000;
function platformFromUserAgent(userAgent = '') {
    if (/bot|crawler|spider|facebookexternalhit/i.test(userAgent))
        return 'bot';
    if (/ipad|tablet/i.test(userAgent))
        return 'tablet';
    if (/mobi|android|iphone/i.test(userAgent))
        return 'mobile';
    return 'desktop';
}
function normalizedCountry(country) {
    const value = country?.trim().toUpperCase();
    return value && /^[A-Z]{2}$/.test(value) ? value : null;
}
function todayUtc() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
async function trackBookView(bookId, context) {
    const visitorHash = (0, node_crypto_1.createHmac)('sha256', env_1.env.JWT_SECRET).update(`${context.userId ?? 'anonymous'}:${context.ip}`).digest('hex');
    const since = new Date(Date.now() - DEDUPLICATION_WINDOW_MS);
    const alreadyTracked = await prisma_1.prisma.bookViewEvent.findFirst({ where: { bookId, visitorHash, viewedAt: { gte: since } }, select: { id: true } });
    if (alreadyTracked) {
        const total = await prisma_1.prisma.viewBooks.findUnique({ where: { bookId }, select: { viewCount: true } });
        return total?.viewCount ?? 0;
    }
    const country = normalizedCountry(context.country);
    const platform = platformFromUserAgent(context.userAgent);
    const viewDate = todayUtc();
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.bookViewEvent.create({ data: { bookId, userId: context.userId, visitorHash, country, platform } }),
        prisma_1.prisma.viewBooks.upsert({ where: { bookId }, create: { bookId, viewCount: 1 }, update: { viewCount: { increment: 1 } } }),
        prisma_1.prisma.viewPerDay.upsert({ where: { bookId_viewDate: { bookId, viewDate } }, create: { bookId, viewDate, views: 1, platform }, update: { views: { increment: 1 } } }),
        ...(country ? [prisma_1.prisma.viewsByCountry.upsert({ where: { bookId_country: { bookId, country } }, create: { bookId, country, totalViews: 1 }, update: { totalViews: { increment: 1 } } })] : []),
        prisma_1.prisma.viewsByPlatform.upsert({ where: { bookId_platform: { bookId, platform } }, create: { bookId, platform, totalViews: 1 }, update: { totalViews: { increment: 1 } } }),
    ]);
    const total = await prisma_1.prisma.viewBooks.findUnique({ where: { bookId }, select: { viewCount: true } });
    return total?.viewCount ?? 0;
}
//# sourceMappingURL=view-tracking.service.js.map