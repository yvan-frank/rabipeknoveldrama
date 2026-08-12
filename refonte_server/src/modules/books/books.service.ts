import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { assertAuthorOwnership } from '../../utils/ownership';
import { slugify } from '../../utils/slugify';
import { getBookReviewStats } from '../comments/comments.service';
import { trackBookView, type ViewContext } from '../stats/view-tracking.service';
import { getActiveUserIdByEmail, grantBookToUser } from '../users/users.service';
import type { AuthUser } from '../auth/auth.types';
import type { CreateBookInput, ListBooksQuery, UpdateBookInput } from './books.schema';

const authorPublicSelect = {
  id: true,
  name: true,
  designation: true,
  image: true,
  cover: true,
  about: true,
} as const;
const categoryPublicSelect = { id: true, name: true, description: true } as const;
const bookPartSelect = {
  id: true,
  title: true,
  partNumber: true,
  description: true,
  price: true,
  isFree: true,
  freeChapterCount: true,
  chapters: { select: { id: true, title: true, chapterNumber: true, partId: true }, orderBy: { chapterNumber: 'asc' as const } },
} as const;

export async function listBooks(query: ListBooksQuery) {
  const { page, pageSize, categoryId, authorId, search, isFree } = query;

  const where: Prisma.BookWhereInput = {
    isPublished: true,
    isBlocked: false,
    suspendedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(authorId ? { authorId } : {}),
    ...(isFree !== undefined ? { isFree } : {}),
    ...(search ? { title: { contains: search } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.book.findMany({
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
    prisma.book.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function listBooksForAdmin() {
  return prisma.book.findMany({ select: { id: true, title: true, slug: true, cover: true, isPublished: true, isBlocked: true, suspendedAt: true, author: { select: { name: true, email: true } }, _count: { select: { chapters: true } } }, orderBy: { createdAt: 'desc' } });
}

export async function moderateBook(id: number, action: 'publish' | 'unpublish' | 'block' | 'suspend' | 'delete') {
  const book = await prisma.book.findUnique({ where: { id }, select: { id: true } });
  if (!book) throw ApiError.notFound('Livre introuvable');
  if (action === 'delete') {
    const purchases = await prisma.achat.count({ where: { bookId: id } });
    if (purchases) throw ApiError.conflict('Impossible de supprimer un livre déjà attribué ou acheté ; bloquez-le plutôt');
    await prisma.book.delete({ where: { id } });
    return null;
  }
  const data = action === 'publish' ? { isPublished: true, isBlocked: false, suspendedAt: null } : action === 'unpublish' ? { isPublished: false } : action === 'block' ? { isPublished: false, isBlocked: true } : { isPublished: false, suspendedAt: new Date() };
  return prisma.book.update({ where: { id }, data, select: { id: true, isPublished: true, isBlocked: true, suspendedAt: true } });
}

// Livres les mieux notés (page d'accueil) : moyenne des avis (table `comments`,
// note 1-5), livres sans aucun avis exclus plutôt que traités comme note 0
// (qui les ferait paraître mal notés au lieu de "non évalués").
export async function getTopRatedBooks(limit: number) {
  const grouped = await prisma.comment.groupBy({
    by: ['bookId'],
    _avg: { rating: true },
    _count: { rating: true },
    orderBy: { _avg: { rating: 'desc' } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const books = await prisma.book.findMany({
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
      if (!book) return null;
      return { ...book, averageRating: group._avg.rating ?? 0, reviewCount: group._count.rating };
    })
    .filter((book): book is NonNullable<typeof book> => book !== null);
}

// Version "légère" utilisée en interne (ownership checks d'update/delete) —
// sans effet de bord ni info spécifique à un visiteur. cf. getBookDetailForViewer
// pour la version publique enrichie. Exportée aussi pour getBookForManage
// ci-dessous (espace auteur : besoin du livre par id, sans passer par le slug
// ni incrémenter les vues comme le ferait la route publique).
export async function getBookById(id: number) {
  const book = await prisma.book.findUnique({
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
    throw ApiError.notFound('Livre introuvable');
  }

  return book;
}

async function getBookBySlug(slug: string) {
  const book = await prisma.book.findUnique({
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
    throw ApiError.notFound('Livre introuvable');
  }

  return book;
}

// Version enrichie utilisée par l'endpoint public GET /books/:slug : vues,
// likes, avis.
//
// ⚠️ L'incrément de vue n'a pas de déduplication (un refresh = +1 vue) —
// suffisant pour un premier affichage, à revoir si la précision devient
// importante (ex. cookie/session-based dedup).
export async function getBookDetailForViewer(slug: string, viewerId?: number, viewContext?: ViewContext) {
  const book = await getBookBySlug(slug);

  const [viewStats, likeCount, isLikedByUser, reviewStats] = await Promise.all([
    viewContext ? trackBookView(book.id, viewContext) : prisma.viewBooks.findUnique({ where: { bookId: book.id }, select: { viewCount: true } }).then((stats) => stats?.viewCount ?? 0),
    prisma.like.count({ where: { bookId: book.id } }),
    viewerId
      ? prisma.like
          .findUnique({ where: { bookId_userId: { bookId: book.id, userId: viewerId } } })
          .then((like) => Boolean(like))
      : Promise.resolve(false),
    getBookReviewStats(book.id),
  ]);

  const purchases = viewerId
    ? await prisma.achat.findMany({ where: { userId: viewerId, bookId: book.id }, select: { partId: true } })
    : [];
  const hasLegacyBookPurchase = purchases.some((purchase) => purchase.partId === null);
  const boughtPartIds = new Set(purchases.map((purchase) => purchase.partId).filter((partId): partId is number => partId !== null));

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
async function generateUniqueBookSlug(title: string): Promise<string> {
  const base = slugify(title) || 'livre';
  let slug = base;
  let suffix = 2;

  while (await prisma.book.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function assertCategoryAndAuthorExist(categoryId?: number, authorId?: number) {
  if (categoryId !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw ApiError.badRequest('Catégorie introuvable');
  }
  if (authorId !== undefined) {
    const author = await prisma.author.findUnique({ where: { id: authorId } });
    if (!author) throw ApiError.badRequest('Auteur introuvable');
  }
}

// Espace auteur : récupérer un livre par id (édition), avec vérification
// d'ownership — distinct de getBookDetailForViewer (public, par slug, avec
// effets de bord comme l'incrément de vue).
export async function getBookForManage(id: number, actingUser: AuthUser) {
  const book = await getBookById(id);
  assertAuthorOwnership(actingUser, book.authorId);
  return book;
}

export async function grantBookToReader(bookId: number, input: { email: string; note?: string }, actingUser: AuthUser) {
  const book = await getBookById(bookId);
  assertAuthorOwnership(actingUser, book.authorId);
  const userId = await getActiveUserIdByEmail(input.email);
  return grantBookToUser(userId, { bookId, note: input.note }, actingUser.id, 'author-grant');
}

// Espace auteur : liste des livres de l'auteur connecté, avec de quoi
// alimenter à la fois "Mes livres" (chapitres) et "Vue d'ensemble" (vues,
// mentions j'aime, avis) sans recharger chaque livre en détail.
export async function listMyBooks(actingUser: AuthUser) {
  if (actingUser.role !== 'admin' && !actingUser.authorId) {
    return [];
  }

  return prisma.book.findMany({
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

export async function createBook(input: CreateBookInput, actingUser: AuthUser) {
  assertAuthorOwnership(actingUser, input.authorId);
  await assertCategoryAndAuthorExist(input.categoryId, input.authorId);

  const { extension, ...bookFields } = input;
  const slug = await generateUniqueBookSlug(input.title);

  return prisma.book.create({
    data: {
      ...bookFields,
      slug,
      ...(extension ? { extension: { create: extension } } : {}),
    },
    include: { extension: true, category: { select: categoryPublicSelect }, author: { select: authorPublicSelect } },
  });
}

export async function updateBook(id: number, input: UpdateBookInput, actingUser: AuthUser) {
  const book = await getBookById(id);
  assertAuthorOwnership(actingUser, book.authorId);
  await assertCategoryAndAuthorExist(input.categoryId, undefined);

  const { extension, ...bookFields } = input;

  return prisma.book.update({
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

export async function deleteBook(id: number, actingUser: AuthUser) {
  const book = await getBookById(id);
  assertAuthorOwnership(actingUser, book.authorId);

  try {
    await prisma.book.delete({ where: { id } });
  } catch (err) {
    // FK onDelete: Restrict sur `achat` — on préserve volontairement l'historique
    // d'achats, un livre déjà vendu ne doit pas pouvoir être supprimé.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw ApiError.conflict('Impossible de supprimer un livre ayant déjà été acheté');
    }
    throw err;
  }
}
