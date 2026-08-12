"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBooks = listBooks;
exports.listBooksForAdmin = listBooksForAdmin;
exports.moderateBook = moderateBook;
exports.getTopRatedBooks = getTopRatedBooks;
exports.getBookById = getBookById;
exports.getBookDetailForViewer = getBookDetailForViewer;
exports.getBookForManage = getBookForManage;
exports.grantBookToReader = grantBookToReader;
exports.listMyBooks = listMyBooks;
exports.createBook = createBook;
exports.updateBook = updateBook;
exports.deleteBook = deleteBook;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
const ownership_1 = require("../../utils/ownership");
const slugify_1 = require("../../utils/slugify");
const comments_service_1 = require("../comments/comments.service");
const view_tracking_service_1 = require("../stats/view-tracking.service");
const users_service_1 = require("../users/users.service");
const authorPublicSelect = {
    id: true,
    name: true,
    designation: true,
    image: true,
    cover: true,
    about: true,
};
const categoryPublicSelect = { id: true, name: true, description: true };
const bookPartSelect = {
    id: true,
    title: true,
    partNumber: true,
    description: true,
    price: true,
    isFree: true,
    freeChapterCount: true,
    chapters: { select: { id: true, title: true, chapterNumber: true, partId: true }, orderBy: { chapterNumber: 'asc' } },
};
async function listBooks(query) {
    const { page, pageSize, categoryId, authorId, search, isFree } = query;
    const where = {
        isPublished: true,
        isBlocked: false,
        suspendedAt: null,
        ...(categoryId ? { categoryId } : {}),
        ...(authorId ? { authorId } : {}),
        ...(isFree !== undefined ? { isFree } : {}),
        ...(search ? { title: { contains: search } } : {}),
    };
    const [items, total] = await Promise.all([
        prisma_1.prisma.book.findMany({
            where,
            select: {
                id: true,
                slug: true,
                title: true,
                cover: true,
                price: true,
                isFree: true,
                isPromotion: true,
                promotionPrice: true,
                isAdultOnly: true,
                datePub: true,
                category: { select: categoryPublicSelect },
                author: { select: authorPublicSelect },
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.book.count({ where }),
    ]);
    return { items, total, page, pageSize };
}
async function listBooksForAdmin() {
    return prisma_1.prisma.book.findMany({ select: { id: true, title: true, slug: true, cover: true, isPublished: true, isBlocked: true, suspendedAt: true, author: { select: { name: true, email: true } }, _count: { select: { chapters: true } } }, orderBy: { createdAt: 'desc' } });
}
async function moderateBook(id, action) {
    const book = await prisma_1.prisma.book.findUnique({ where: { id }, select: { id: true } });
    if (!book)
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    if (action === 'delete') {
        const purchases = await prisma_1.prisma.achat.count({ where: { bookId: id } });
        if (purchases)
            throw ApiError_1.ApiError.conflict('Impossible de supprimer un livre déjà attribué ou acheté ; bloquez-le plutôt');
        await prisma_1.prisma.book.delete({ where: { id } });
        return null;
    }
    const data = action === 'publish' ? { isPublished: true, isBlocked: false, suspendedAt: null } : action === 'unpublish' ? { isPublished: false } : action === 'block' ? { isPublished: false, isBlocked: true } : { isPublished: false, suspendedAt: new Date() };
    return prisma_1.prisma.book.update({ where: { id }, data, select: { id: true, isPublished: true, isBlocked: true, suspendedAt: true } });
}
// Livres les mieux notés (page d'accueil) : moyenne des avis (table `comments`,
// note 1-5), livres sans aucun avis exclus plutôt que traités comme note 0
// (qui les ferait paraître mal notés au lieu de "non évalués").
async function getTopRatedBooks(limit) {
    const grouped = await prisma_1.prisma.comment.groupBy({
        by: ['bookId'],
        _avg: { rating: true },
        _count: { rating: true },
        orderBy: { _avg: { rating: 'desc' } },
        take: limit,
    });
    if (grouped.length === 0)
        return [];
    const books = await prisma_1.prisma.book.findMany({
        where: { id: { in: grouped.map((g) => g.bookId) } },
        select: {
            id: true,
            slug: true,
            title: true,
            cover: true,
            price: true,
            isFree: true,
            isPromotion: true,
            promotionPrice: true,
            datePub: true,
            category: { select: categoryPublicSelect },
            author: { select: authorPublicSelect },
        },
    });
    const booksById = new Map(books.map((book) => [book.id, book]));
    return grouped
        .map((group) => {
        const book = booksById.get(group.bookId);
        if (!book)
            return null;
        return { ...book, averageRating: group._avg.rating ?? 0, reviewCount: group._count.rating };
    })
        .filter((book) => book !== null);
}
// Version "légère" utilisée en interne (ownership checks d'update/delete) —
// sans effet de bord ni info spécifique à un visiteur. cf. getBookDetailForViewer
// pour la version publique enrichie. Exportée aussi pour getBookForManage
// ci-dessous (espace auteur : besoin du livre par id, sans passer par le slug
// ni incrémenter les vues comme le ferait la route publique).
async function getBookById(id) {
    const book = await prisma_1.prisma.book.findUnique({
        where: { id },
        include: {
            category: { select: categoryPublicSelect },
            author: { select: authorPublicSelect },
            extension: true,
            parts: { select: bookPartSelect, orderBy: { partNumber: 'asc' } },
            chapters: {
                select: { id: true, title: true, chapterNumber: true, partId: true },
                orderBy: { chapterNumber: 'asc' },
            },
        },
    });
    if (!book) {
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    }
    return book;
}
async function getBookBySlug(slug) {
    const book = await prisma_1.prisma.book.findUnique({
        where: { slug },
        include: {
            category: { select: categoryPublicSelect },
            author: { select: authorPublicSelect },
            extension: true,
            parts: { select: bookPartSelect, orderBy: { partNumber: 'asc' } },
            chapters: {
                select: { id: true, title: true, chapterNumber: true, partId: true },
                orderBy: { chapterNumber: 'asc' },
            },
        },
    });
    if (!book) {
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    }
    return book;
}
// Version enrichie utilisée par l'endpoint public GET /books/:slug : vues,
// likes, avis.
//
// ⚠️ L'incrément de vue n'a pas de déduplication (un refresh = +1 vue) —
// suffisant pour un premier affichage, à revoir si la précision devient
// importante (ex. cookie/session-based dedup).
async function getBookDetailForViewer(slug, viewerId, viewContext) {
    const book = await getBookBySlug(slug);
    const [viewStats, likeCount, isLikedByUser, reviewStats] = await Promise.all([
        viewContext ? (0, view_tracking_service_1.trackBookView)(book.id, viewContext) : prisma_1.prisma.viewBooks.findUnique({ where: { bookId: book.id }, select: { viewCount: true } }).then((stats) => stats?.viewCount ?? 0),
        prisma_1.prisma.like.count({ where: { bookId: book.id } }),
        viewerId
            ? prisma_1.prisma.like
                .findUnique({ where: { bookId_userId: { bookId: book.id, userId: viewerId } } })
                .then((like) => Boolean(like))
            : Promise.resolve(false),
        (0, comments_service_1.getBookReviewStats)(book.id),
    ]);
    const purchases = viewerId
        ? await prisma_1.prisma.achat.findMany({ where: { userId: viewerId, bookId: book.id }, select: { partId: true } })
        : [];
    const hasLegacyBookPurchase = purchases.some((purchase) => purchase.partId === null);
    const boughtPartIds = new Set(purchases.map((purchase) => purchase.partId).filter((partId) => partId !== null));
    return {
        ...book,
        parts: book.parts.map((part) => ({ ...part, isPurchased: hasLegacyBookPurchase || boughtPartIds.has(part.id) })),
        viewCount: viewStats,
        likeCount,
        isLikedByUser,
        ...reviewStats,
    };
}
// Slug figé à la création, jamais régénéré ensuite (changer l'URL d'un livre
// déjà publié/indexé casserait les liens existants et le référencement).
async function generateUniqueBookSlug(title) {
    const base = (0, slugify_1.slugify)(title) || 'livre';
    let slug = base;
    let suffix = 2;
    while (await prisma_1.prisma.book.findUnique({ where: { slug }, select: { id: true } })) {
        slug = `${base}-${suffix}`;
        suffix += 1;
    }
    return slug;
}
async function assertCategoryAndAuthorExist(categoryId, authorId) {
    if (categoryId !== undefined) {
        const category = await prisma_1.prisma.category.findUnique({ where: { id: categoryId } });
        if (!category)
            throw ApiError_1.ApiError.badRequest('Catégorie introuvable');
    }
    if (authorId !== undefined) {
        const author = await prisma_1.prisma.author.findUnique({ where: { id: authorId } });
        if (!author)
            throw ApiError_1.ApiError.badRequest('Auteur introuvable');
    }
}
// Espace auteur : récupérer un livre par id (édition), avec vérification
// d'ownership — distinct de getBookDetailForViewer (public, par slug, avec
// effets de bord comme l'incrément de vue).
async function getBookForManage(id, actingUser) {
    const book = await getBookById(id);
    (0, ownership_1.assertAuthorOwnership)(actingUser, book.authorId);
    return book;
}
async function grantBookToReader(bookId, input, actingUser) {
    const book = await getBookById(bookId);
    (0, ownership_1.assertAuthorOwnership)(actingUser, book.authorId);
    const userId = await (0, users_service_1.getActiveUserIdByEmail)(input.email);
    return (0, users_service_1.grantBookToUser)(userId, { bookId, note: input.note }, actingUser.id, 'author-grant');
}
// Espace auteur : liste des livres de l'auteur connecté, avec de quoi
// alimenter à la fois "Mes livres" (chapitres) et "Vue d'ensemble" (vues,
// mentions j'aime, avis) sans recharger chaque livre en détail.
async function listMyBooks(actingUser) {
    if (actingUser.role !== 'admin' && !actingUser.authorId) {
        return [];
    }
    return prisma_1.prisma.book.findMany({
        where: actingUser.role === 'admin' ? {} : { authorId: actingUser.authorId },
        select: {
            id: true,
            slug: true,
            title: true,
            cover: true,
            price: true,
            isFree: true,
            isPromotion: true,
            promotionPrice: true,
            datePub: true,
            category: { select: categoryPublicSelect },
            viewStats: { select: { viewCount: true } },
            _count: { select: { chapters: true, likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function createBook(input, actingUser) {
    (0, ownership_1.assertAuthorOwnership)(actingUser, input.authorId);
    await assertCategoryAndAuthorExist(input.categoryId, input.authorId);
    const { extension, ...bookFields } = input;
    const slug = await generateUniqueBookSlug(input.title);
    return prisma_1.prisma.book.create({
        data: {
            ...bookFields,
            slug,
            ...(extension ? { extension: { create: extension } } : {}),
        },
        include: { extension: true, category: { select: categoryPublicSelect }, author: { select: authorPublicSelect } },
    });
}
async function updateBook(id, input, actingUser) {
    const book = await getBookById(id);
    (0, ownership_1.assertAuthorOwnership)(actingUser, book.authorId);
    await assertCategoryAndAuthorExist(input.categoryId, undefined);
    const { extension, ...bookFields } = input;
    return prisma_1.prisma.book.update({
        where: { id },
        data: {
            ...bookFields,
            ...(extension
                ? { extension: { upsert: { create: extension, update: extension } } }
                : {}),
        },
        // Même forme que getBookById (chapters incluses) : la réponse de PATCH
        // remplace le livre en cache côté client (react-query `setQueryData`),
        // une réponse partielle y effacerait les chapitres déjà chargées.
        include: {
            extension: true,
            category: { select: categoryPublicSelect },
            author: { select: authorPublicSelect },
            parts: { select: bookPartSelect, orderBy: { partNumber: 'asc' } },
            chapters: { select: { id: true, title: true, chapterNumber: true, partId: true }, orderBy: { chapterNumber: 'asc' } },
        },
    });
}
async function deleteBook(id, actingUser) {
    const book = await getBookById(id);
    (0, ownership_1.assertAuthorOwnership)(actingUser, book.authorId);
    try {
        await prisma_1.prisma.book.delete({ where: { id } });
    }
    catch (err) {
        // FK onDelete: Restrict sur `achat` — on préserve volontairement l'historique
        // d'achats, un livre déjà vendu ne doit pas pouvoir être supprimé.
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
            throw ApiError_1.ApiError.conflict('Impossible de supprimer un livre ayant déjà été acheté');
        }
        throw err;
    }
}
//# sourceMappingURL=books.service.js.map