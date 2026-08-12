import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import type { CreateChapterCommentInput, UpsertReviewInput } from './comments.schema';
import { assertAuthorOwnership } from '../../utils/ownership';
import type { AuthUser } from '../auth/auth.types';

const reviewerSelect = { id: true, name: true } as const;

// "Avis" = un commentaire sur un livre (table `commentaires`, contrainte
// unique bookId+userId : un seul avis par utilisateur et par livre — un
// second envoi met à jour l'avis existant plutôt que d'en créer un doublon).
export async function listBookReviews(bookId: number) {
  return prisma.comment.findMany({
    where: { bookId },
    select: {
      id: true,
      message: true,
      rating: true,
      createdAt: true,
      user: { select: reviewerSelect },
      replies: { select: { id: true, content: true, createdAt: true }, },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function replyToBookReview(commentId: number, content: string, responder: AuthUser) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId }, include: { book: { select: { authorId: true } } } });
  if (!comment) throw ApiError.notFound('Avis introuvable');
  assertAuthorOwnership(responder, comment.book.authorId);
  return prisma.bookReviewReply.upsert({ where: { commentId }, create: { commentId, responderId: responder.id, content }, update: { content }, select: { id: true, content: true, createdAt: true } });
}

export async function getBookReviewStats(bookId: number) {
  const aggregate = await prisma.comment.aggregate({
    where: { bookId },
    _avg: { rating: true },
    _count: true,
  });

  return {
    reviewCount: aggregate._count,
    averageRating: aggregate._avg.rating ?? 0,
  };
}

export async function upsertBookReview(bookId: number, userId: number, input: UpsertReviewInput) {
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
  if (!book) {
    throw ApiError.notFound('Livre introuvable');
  }

  return prisma.comment.upsert({
    where: { bookId_userId: { bookId, userId } },
    create: { bookId, userId, message: input.message, rating: input.rating },
    update: { message: input.message, rating: input.rating },
    select: {
      id: true,
      message: true,
      rating: true,
      createdAt: true,
      user: { select: reviewerSelect },
    },
  });
}

// Fil de discussion par chapitre — liste à plat (triée chronologiquement),
// le regroupement commentaire/réponses via `parentId` se fait côté frontend.
// Plusieurs commentaires par utilisateur autorisés, contrairement aux avis
// livre (pas de contrainte unique ici, cf. décision produit).
export async function listChapterComments(chapterId: number) {
  return prisma.chapterComment.findMany({
    where: { chapterId },
    select: {
      id: true,
      content: true,
      parentId: true,
      createdAt: true,
      user: { select: reviewerSelect },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createChapterComment(
  chapterId: number,
  userId: number,
  input: CreateChapterCommentInput,
) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
  if (!chapter) {
    throw ApiError.notFound('Chapitre introuvable');
  }

  if (input.parentId !== undefined) {
    const parent = await prisma.chapterComment.findUnique({
      where: { id: input.parentId },
      select: { chapterId: true },
    });
    if (!parent || parent.chapterId !== chapterId) {
      throw ApiError.badRequest('Commentaire parent introuvable pour ce chapitre');
    }
  }

  return prisma.chapterComment.create({
    data: { chapterId, userId, content: input.content, parentId: input.parentId },
    select: {
      id: true,
      content: true,
      parentId: true,
      createdAt: true,
      user: { select: reviewerSelect },
    },
  });
}
