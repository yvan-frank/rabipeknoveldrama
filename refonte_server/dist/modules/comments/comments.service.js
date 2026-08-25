"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBookReviews = listBookReviews;
exports.replyToBookReview = replyToBookReview;
exports.getBookReviewStats = getBookReviewStats;
exports.upsertBookReview = upsertBookReview;
exports.listChapterComments = listChapterComments;
exports.createChapterComment = createChapterComment;
exports.deleteChapterComment = deleteChapterComment;
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
const ownership_1 = require("../../utils/ownership");
const reviewerSelect = { id: true, name: true };
// "Avis" = un commentaire sur un livre (table `commentaires`, contrainte
// unique bookId+userId : un seul avis par utilisateur et par livre — un
// second envoi met à jour l'avis existant plutôt que d'en créer un doublon).
async function listBookReviews(bookId) {
    return prisma_1.prisma.comment.findMany({
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
async function replyToBookReview(commentId, content, responder) {
    const comment = await prisma_1.prisma.comment.findUnique({ where: { id: commentId }, include: { book: { select: { authorId: true } } } });
    if (!comment)
        throw ApiError_1.ApiError.notFound('Avis introuvable');
    (0, ownership_1.assertAuthorOwnership)(responder, comment.book.authorId);
    return prisma_1.prisma.bookReviewReply.upsert({ where: { commentId }, create: { commentId, responderId: responder.id, content }, update: { content }, select: { id: true, content: true, createdAt: true } });
}
async function getBookReviewStats(bookId) {
    const aggregate = await prisma_1.prisma.comment.aggregate({
        where: { bookId },
        _avg: { rating: true },
        _count: true,
    });
    return {
        reviewCount: aggregate._count,
        averageRating: aggregate._avg.rating ?? 0,
    };
}
async function upsertBookReview(bookId, userId, input) {
    const book = await prisma_1.prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
    if (!book) {
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    }
    return prisma_1.prisma.comment.upsert({
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
async function listChapterComments(chapterId) {
    return prisma_1.prisma.chapterComment.findMany({
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
async function createChapterComment(chapterId, userId, input) {
    const chapter = await prisma_1.prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
    if (!chapter) {
        throw ApiError_1.ApiError.notFound('Chapitre introuvable');
    }
    if (input.parentId !== undefined) {
        const parent = await prisma_1.prisma.chapterComment.findUnique({
            where: { id: input.parentId },
            select: { chapterId: true },
        });
        if (!parent || parent.chapterId !== chapterId) {
            throw ApiError_1.ApiError.badRequest('Commentaire parent introuvable pour ce chapitre');
        }
    }
    return prisma_1.prisma.chapterComment.create({
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
// Seul l'auteur du commentaire peut le supprimer (pas de modération
// auteur/admin ici, contrairement aux avis livre — cf. commentaire sur
// comments.routes.ts : les comptes Author n'ont pas encore d'auth câblée).
// onDelete: Cascade sur ChapterComment.parent (cf. schema.prisma) supprime
// automatiquement les réponses du fil avec leur parent.
async function deleteChapterComment(commentId, userId) {
    const comment = await prisma_1.prisma.chapterComment.findUnique({ where: { id: commentId }, select: { userId: true } });
    if (!comment)
        throw ApiError_1.ApiError.notFound('Commentaire introuvable');
    if (comment.userId !== userId)
        throw ApiError_1.ApiError.forbidden("Vous ne pouvez supprimer que vos propres commentaires");
    await prisma_1.prisma.chapterComment.delete({ where: { id: commentId } });
}
//# sourceMappingURL=comments.service.js.map