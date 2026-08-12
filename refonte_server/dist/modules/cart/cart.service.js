"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCart = listCart;
exports.addPartToCart = addPartToCart;
exports.removePartFromCart = removePartFromCart;
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
const partSelect = { id: true, title: true, partNumber: true, price: true, isFree: true, book: { select: { id: true, title: true, slug: true, cover: true } } };
async function listCart(userId) {
    return prisma_1.prisma.cart.findMany({ where: { userId, partId: { not: null } }, include: { part: { select: partSelect } }, orderBy: { createdAt: 'desc' } });
}
async function addPartToCart(userId, partId) {
    const part = await prisma_1.prisma.bookPart.findUnique({ where: { id: partId }, select: { id: true, bookId: true, isFree: true } });
    if (!part)
        throw ApiError_1.ApiError.notFound('Partie introuvable');
    if (part.isFree)
        throw ApiError_1.ApiError.badRequest('Cette partie est déjà gratuite');
    const [purchase, existing] = await Promise.all([
        prisma_1.prisma.achat.findFirst({ where: { userId, partId }, select: { id: true } }),
        prisma_1.prisma.cart.findFirst({ where: { userId, partId }, select: { id: true } }),
    ]);
    if (purchase)
        throw ApiError_1.ApiError.conflict('Vous possédez déjà cette partie');
    if (existing)
        return existing;
    return prisma_1.prisma.cart.create({ data: { userId, bookId: part.bookId, partId, quantity: 1 } });
}
async function removePartFromCart(userId, partId) {
    await prisma_1.prisma.cart.deleteMany({ where: { userId, partId } });
}
//# sourceMappingURL=cart.service.js.map