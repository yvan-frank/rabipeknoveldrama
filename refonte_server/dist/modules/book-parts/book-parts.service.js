"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBookParts = listBookParts;
exports.createBookPart = createBookPart;
exports.updateBookPart = updateBookPart;
exports.deleteBookPart = deleteBookPart;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
const ownership_1 = require("../../utils/ownership");
const publicPartSelect = {
    id: true,
    title: true,
    partNumber: true,
    description: true,
    price: true,
    isFree: true,
    freeChapterCount: true,
    chapters: { select: { id: true, title: true, chapterNumber: true, partId: true }, orderBy: { chapterNumber: 'asc' } },
};
async function getPartWithBook(id) {
    const part = await prisma_1.prisma.bookPart.findUnique({
        where: { id },
        include: { book: { select: { id: true, authorId: true } } },
    });
    if (!part)
        throw ApiError_1.ApiError.notFound('Partie introuvable');
    return part;
}
async function listBookParts(bookId) {
    return prisma_1.prisma.bookPart.findMany({
        where: { bookId },
        select: publicPartSelect,
        orderBy: { partNumber: 'asc' },
    });
}
async function createBookPart(input, actingUser) {
    const book = await prisma_1.prisma.book.findUnique({ where: { id: input.bookId }, select: { id: true, authorId: true } });
    if (!book)
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    (0, ownership_1.assertAuthorOwnership)(actingUser, book.authorId);
    try {
        return await prisma_1.prisma.bookPart.create({ data: input, select: publicPartSelect });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw ApiError_1.ApiError.conflict('Ce numéro de partie existe déjà pour ce livre');
        }
        throw error;
    }
}
async function updateBookPart(id, input, actingUser) {
    const part = await getPartWithBook(id);
    (0, ownership_1.assertAuthorOwnership)(actingUser, part.book.authorId);
    try {
        return await prisma_1.prisma.bookPart.update({ where: { id }, data: input, select: publicPartSelect });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw ApiError_1.ApiError.conflict('Ce numéro de partie existe déjà pour ce livre');
        }
        throw error;
    }
}
async function deleteBookPart(id, actingUser) {
    const part = await getPartWithBook(id);
    (0, ownership_1.assertAuthorOwnership)(actingUser, part.book.authorId);
    try {
        await prisma_1.prisma.bookPart.delete({ where: { id } });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            throw ApiError_1.ApiError.conflict('Impossible de supprimer une partie déjà achetée');
        }
        throw error;
    }
}
//# sourceMappingURL=book-parts.service.js.map