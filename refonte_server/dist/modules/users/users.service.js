"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUserById = getUserById;
exports.softDeleteUser = softDeleteUser;
exports.grantBookToUser = grantBookToUser;
exports.getActiveUserIdByEmail = getActiveUserIdByEmail;
exports.listBookGrants = listBookGrants;
exports.revokeBookGrant = revokeBookGrant;
exports.getUserDashboard = getUserDashboard;
exports.getAdminDashboard = getAdminDashboard;
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
// Sélection explicite des colonnes exposées : jamais passwordHash côté API.
const publicUserSelect = {
    id: true,
    name: true,
    email: true,
    isAdmin: true,
    isActive: true,
    createdAt: true,
};
async function listUsers({ page, pageSize }) {
    const [items, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
            where: { deletedAt: null },
            select: publicUserSelect,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.user.count({ where: { deletedAt: null } }),
    ]);
    return { items, total, page, pageSize };
}
async function getUserById(id) {
    const user = await prisma_1.prisma.user.findFirst({
        where: { id, deletedAt: null },
        select: publicUserSelect,
    });
    if (!user) {
        throw ApiError_1.ApiError.notFound('Utilisateur introuvable');
    }
    return user;
}
async function softDeleteUser(id) {
    await getUserById(id);
    await prisma_1.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
}
// Attribution manuelle temporaire, avant l'intégration des moyens de paiement.
// Un Achat de livre (partId = null) est déjà la source de vérité des droits de
// lecture : ce format donne donc accès à toutes les parties sans contourner le
// paywall ni ajouter une seconde logique d'autorisation.
async function grantBookToUser(userId, input, grantedByUserId, paymentMethod = 'admin-grant') {
    const [user, book] = await Promise.all([
        prisma_1.prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true, name: true, email: true } }),
        prisma_1.prisma.book.findUnique({ where: { id: input.bookId }, select: { id: true, title: true, slug: true } }),
    ]);
    if (!user)
        throw ApiError_1.ApiError.notFound('Utilisateur introuvable');
    if (!book)
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    const existingGrant = await prisma_1.prisma.achat.findFirst({
        where: { userId, bookId: book.id, partId: null },
        select: { id: true },
    });
    if (existingGrant)
        throw ApiError_1.ApiError.conflict('Cet utilisateur possède déjà ce livre');
    const metadata = input.note
        ? { source: paymentMethod, grantedByUserId, note: input.note }
        : { source: paymentMethod, grantedByUserId };
    const grant = await prisma_1.prisma.$transaction(async (tx) => {
        const purchase = await tx.achat.create({
            data: {
                userId,
                bookId: book.id,
                price: 0,
                isFree: true,
                paymentMethod,
                metadata,
            },
            select: { id: true, date: true, price: true, paymentMethod: true },
        });
        // Le panier n'a plus lieu d'être une fois l'accès intégral accordé.
        await tx.cart.deleteMany({ where: { userId, bookId: book.id } });
        return purchase;
    });
    return { ...grant, user, book };
}
async function getActiveUserIdByEmail(email) {
    const user = await prisma_1.prisma.user.findFirst({ where: { email, deletedAt: null }, select: { id: true } });
    if (!user)
        throw ApiError_1.ApiError.notFound('Utilisateur introuvable');
    return user.id;
}
async function listBookGrants({ page, pageSize }) {
    const where = { paymentMethod: 'admin-grant' };
    const [items, total] = await Promise.all([
        prisma_1.prisma.achat.findMany({
            where,
            select: {
                id: true,
                date: true,
                metadata: true,
                user: { select: { id: true, name: true, email: true } },
                book: { select: { id: true, title: true, slug: true, cover: true } },
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { date: 'desc' },
        }),
        prisma_1.prisma.achat.count({ where }),
    ]);
    return {
        items: items.map((grant) => {
            const note = grant.metadata && typeof grant.metadata === 'object' && !Array.isArray(grant.metadata) && typeof grant.metadata.note === 'string'
                ? grant.metadata.note
                : null;
            return { ...grant, note };
        }),
        total,
        page,
        pageSize,
    };
}
// Seules les attributions manuelles sont révocables ici. Un achat réel ne
// peut jamais être supprimé par cette opération administrative.
async function revokeBookGrant(grantId) {
    const result = await prisma_1.prisma.achat.deleteMany({ where: { id: grantId, paymentMethod: 'admin-grant' } });
    if (result.count === 0)
        throw ApiError_1.ApiError.notFound('Attribution introuvable ou non révocable');
}
const dashboardBookSelect = { id: true, title: true, slug: true, cover: true };
const dashboardBookWithChapterCountSelect = {
    ...dashboardBookSelect,
    _count: { select: { chapters: true } },
};
const dashboardPartSelect = { id: true, title: true, partNumber: true };
async function getUserDashboard(userId) {
    const [cart, purchases, allReads, likedBooks, counts] = await Promise.all([
        prisma_1.prisma.cart.findMany({
            where: { userId },
            include: { book: { select: dashboardBookSelect } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.achat.findMany({
            where: { userId },
            include: { book: { select: dashboardBookWithChapterCountSelect }, part: { select: dashboardPartSelect } },
            orderBy: { date: 'desc' },
        }),
        // Un seul enregistrement par livre (cf. contrainte unique userId+bookId) :
        // représente la position de lecture actuelle, pas un historique complet.
        prisma_1.prisma.readBook.findMany({
            where: { userId },
            include: { book: { select: dashboardBookWithChapterCountSelect } },
            orderBy: { readAt: 'desc' },
        }),
        prisma_1.prisma.like.findMany({
            where: { userId },
            include: { book: { select: dashboardBookSelect } },
            orderBy: { likedAt: 'desc' },
            take: 6,
        }),
        Promise.all([
            prisma_1.prisma.cart.count({ where: { userId } }),
            prisma_1.prisma.achat.count({ where: { userId } }),
            prisma_1.prisma.readBook.count({ where: { userId } }),
            prisma_1.prisma.like.count({ where: { userId } }),
            prisma_1.prisma.comment.count({ where: { userId } }),
            prisma_1.prisma.chapterComment.count({ where: { userId } }),
            prisma_1.prisma.share.count({ where: { userId } }),
        ]),
    ]);
    const [cartCount, purchaseCount, readCount, likeCount, reviewCount, chapterCommentCount, shareCount] = counts;
    // "Ma bibliothèque" = tout livre acheté OU commencé (même gratuit/aperçu),
    // dédupliqué par livre, avec la progression de lecture quand elle existe.
    const libraryByBookId = new Map();
    for (const purchase of purchases) {
        const existing = libraryByBookId.get(purchase.book.id);
        libraryByBookId.set(purchase.book.id, {
            id: purchase.book.id,
            book: purchase.book,
            totalChapters: purchase.book._count.chapters,
            chapterRead: existing?.chapterRead ?? null,
            // Un achat historique de livre donne accès à l'ensemble. Les nouveaux
            // achats de partie restent listés précisément dans purchasedParts.
            purchased: existing?.purchased ?? purchase.part === null,
            purchasedParts: [...(existing?.purchasedParts ?? []), ...(purchase.part ? [purchase.part.title] : [])],
            lastActivityAt: purchase.date,
        });
    }
    for (const read of allReads) {
        const existing = libraryByBookId.get(read.book.id);
        libraryByBookId.set(read.book.id, {
            id: read.book.id,
            book: read.book,
            totalChapters: read.book._count.chapters,
            chapterRead: read.chapterRead,
            purchased: existing?.purchased ?? false,
            purchasedParts: existing?.purchasedParts ?? [],
            lastActivityAt: read.readAt,
        });
    }
    const library = Array.from(libraryByBookId.values()).sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
    return {
        cart,
        purchases: purchases.slice(0, 6),
        recentReads: allReads.slice(0, 4),
        library,
        likedBooks,
        counts: {
            cart: cartCount,
            purchases: purchaseCount,
            reads: readCount,
            likes: likeCount,
            comments: reviewCount + chapterCommentCount,
            shares: shareCount,
        },
    };
}
async function getAdminDashboard() {
    const [recentUsers, recentBooks, counts, purchaseTotal] = await Promise.all([
        prisma_1.prisma.user.findMany({
            where: { deletedAt: null },
            select: publicUserSelect,
            orderBy: { createdAt: 'desc' },
            take: 6,
        }),
        prisma_1.prisma.book.findMany({
            select: {
                id: true,
                title: true,
                slug: true,
                cover: true,
                datePub: true,
                isFree: true,
                price: true,
                author: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 6,
        }),
        Promise.all([
            prisma_1.prisma.user.count({ where: { deletedAt: null } }),
            prisma_1.prisma.author.count(),
            prisma_1.prisma.book.count(),
            prisma_1.prisma.chapter.count(),
            prisma_1.prisma.achat.count(),
            prisma_1.prisma.comment.count(),
            prisma_1.prisma.chapterComment.count(),
            prisma_1.prisma.like.count(),
            prisma_1.prisma.share.count(),
            prisma_1.prisma.cart.count(),
        ]),
        prisma_1.prisma.achat.aggregate({ _sum: { price: true }, where: { isFree: false } }),
    ]);
    const [users, authors, books, chapters, purchases, reviews, chapterComments, likes, shares, carts] = counts;
    return {
        recentUsers,
        recentBooks,
        revenue: purchaseTotal._sum.price ?? 0,
        counts: { users, authors, books, chapters, purchases, reviews: reviews + chapterComments, likes, shares, carts },
    };
}
//# sourceMappingURL=users.service.js.map