import { createHmac } from 'node:crypto';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';

const DEDUPLICATION_WINDOW_MS = 30 * 60 * 1000;

export interface ViewContext {
  userId?: number;
  ip: string;
  userAgent?: string;
  country?: string;
}

function platformFromUserAgent(userAgent = '') {
  if (/bot|crawler|spider|facebookexternalhit/i.test(userAgent)) return 'bot';
  if (/ipad|tablet/i.test(userAgent)) return 'tablet';
  if (/mobi|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

function normalizedCountry(country?: string) {
  const value = country?.trim().toUpperCase();
  return value && /^[A-Z]{2}$/.test(value) ? value : null;
}

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function trackBookView(bookId: number, context: ViewContext) {
  const visitorHash = createHmac('sha256', env.JWT_SECRET).update(`${context.userId ?? 'anonymous'}:${context.ip}`).digest('hex');
  const since = new Date(Date.now() - DEDUPLICATION_WINDOW_MS);
  const alreadyTracked = await prisma.bookViewEvent.findFirst({ where: { bookId, visitorHash, viewedAt: { gte: since } }, select: { id: true } });
  if (alreadyTracked) {
    const total = await prisma.viewBooks.findUnique({ where: { bookId }, select: { viewCount: true } });
    return total?.viewCount ?? 0;
  }

  const country = normalizedCountry(context.country);
  const platform = platformFromUserAgent(context.userAgent);
  const viewDate = todayUtc();
  await prisma.$transaction([
    prisma.bookViewEvent.create({ data: { bookId, userId: context.userId, visitorHash, country, platform } }),
    prisma.viewBooks.upsert({ where: { bookId }, create: { bookId, viewCount: 1 }, update: { viewCount: { increment: 1 } } }),
    prisma.viewPerDay.upsert({ where: { bookId_viewDate: { bookId, viewDate } }, create: { bookId, viewDate, views: 1, platform }, update: { views: { increment: 1 } } }),
    ...(country ? [prisma.viewsByCountry.upsert({ where: { bookId_country: { bookId, country } }, create: { bookId, country, totalViews: 1 }, update: { totalViews: { increment: 1 } } })] : []),
    prisma.viewsByPlatform.upsert({ where: { bookId_platform: { bookId, platform } }, create: { bookId, platform, totalViews: 1 }, update: { totalViews: { increment: 1 } } }),
  ]);
  const total = await prisma.viewBooks.findUnique({ where: { bookId }, select: { viewCount: true } });
  return total?.viewCount ?? 0;
}
