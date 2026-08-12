"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleBookLike = toggleBookLike;
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
async function toggleBookLike(bookId, userId) {
    const book = await prisma_1.prisma.book.findUnique({ where: { id: bookId }, select: { id: true } });
    if (!book) {
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    }
    const existing = await prisma_1.prisma.like.findUnique({
        where: { bookId_userId: { bookId, userId } },
    });
    if (existing) {
        await prisma_1.prisma.like.delete({ where: { id: existing.id } });
    }
    else {
        await prisma_1.prisma.like.create({ data: { bookId, userId } });
    }
    const likeCount = await prisma_1.prisma.like.count({ where: { bookId } });
    return { liked: !existing, likeCount };
}
//# sourceMappingURL=likes.service.js.map