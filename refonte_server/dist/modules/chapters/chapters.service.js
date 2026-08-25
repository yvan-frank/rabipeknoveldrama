"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChaptersByBook = listChaptersByBook;
exports.getChapterById = getChapterById;
exports.getChapterForManage = getChapterForManage;
exports.setReadingProgress = setReadingProgress;
exports.getReadingProgress = getReadingProgress;
exports.getChapterForViewer = getChapterForViewer;
exports.createChapter = createChapter;
exports.updateChapter = updateChapter;
exports.deleteChapter = deleteChapter;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
const ownership_1 = require("../../utils/ownership");
const chapter_content_encryption_1 = require("../../utils/chapter-content-encryption");
async function getBookOrThrow(bookId) {
    const book = await prisma_1.prisma.book.findUnique({ where: { id: bookId }, select: { id: true, authorId: true } });
    if (!book) {
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    }
    return book;
}
// Contenu volontairement exclu de la liste : potentiellement très volumineux
// (longtext) et inutile pour un sommaire de chapitres.
async function listChaptersByBook(bookId) {
    await getBookOrThrow(bookId);
    return prisma_1.prisma.chapter.findMany({
        where: { bookId },
        select: { id: true, title: true, chapterNumber: true, partId: true },
        orderBy: { chapterNumber: 'asc' },
    });
}
async function assertPartBelongsToBook(partId, bookId) {
    if (partId === undefined || partId === null)
        return;
    const part = await prisma_1.prisma.bookPart.findFirst({ where: { id: partId, bookId }, select: { id: true } });
    if (!part)
        throw ApiError_1.ApiError.badRequest('Cette partie ne correspond pas au livre du chapitre');
}
// Version "légère" utilisée en interne (ownership checks d'update/delete) —
// sans vérification d'accès lecteur. cf. getChapterForViewer pour la
// version publique qui applique le paywall.
async function getChapterById(id) {
    const chapter = await prisma_1.prisma.chapter.findUnique({
        where: { id },
        include: {
            extension: true,
            part: { select: { id: true, title: true, partNumber: true, isFree: true, freeChapterCount: true, price: true } },
            book: { select: { id: true, title: true, authorId: true } },
        },
    });
    if (!chapter) {
        throw ApiError_1.ApiError.notFound('Chapitre introuvable');
    }
    return chapter;
}
// Espace auteur : récupérer un chapitre complet (contenu inclus) pour
// édition, avec vérification d'ownership — distinct de getChapterForViewer
// (paywall lecteur, jamais pertinent pour l'auteur qui gère son propre livre).
async function getChapterForManage(id, actingUser) {
    const chapter = await getChapterById(id);
    (0, ownership_1.assertAuthorOwnership)(actingUser, chapter.book.authorId);
    return { ...chapter, content: (0, chapter_content_encryption_1.decryptChapterContent)(chapter.content) };
}
// Paywall : la lecture exige toujours d'être connecté, y compris pour un
// livre gratuit ou les `freeChapterCount` premiers chapitres d'un livre
// payant (401 si anonyme). Une fois connecté, ces chapitres "aperçu" restent
// lisibles sans achat ; au-delà, il faut avoir acheté le livre (403 sinon) —
// les admins passent toujours. Pas de vérification pour le rôle 'author' :
// ce rôle n'a pas encore de session JWT possible sur ce serveur (cf. README),
// donc jamais présent dans `viewer` en pratique pour l'instant.
async function assertChapterAccess(chapter, viewer) {
    if (!viewer) {
        throw ApiError_1.ApiError.unauthorized('Connectez-vous pour lire ce chapitre');
    }
    if (viewer.role === 'admin')
        return;
    if (chapter.part && chapter.partId) {
        if (chapter.part.isFree)
            return;
        const precedingChapterCount = await prisma_1.prisma.chapter.count({
            where: { partId: chapter.partId, chapterNumber: { lte: chapter.chapterNumber } },
        });
        if (precedingChapterCount <= chapter.part.freeChapterCount)
            return;
        const partPurchase = await prisma_1.prisma.achat.findFirst({
            where: { userId: viewer.id, OR: [{ partId: chapter.partId }, { bookId: chapter.book.id, partId: null }] },
            select: { id: true },
        });
        if (!partPurchase)
            throw ApiError_1.ApiError.forbidden('Achetez cette partie pour lire ce chapitre');
        return;
    }
    if (chapter.book.isFree)
        return;
    if (chapter.chapterNumber <= chapter.book.freeChapterCount)
        return;
    const purchase = await prisma_1.prisma.achat.findFirst({
        where: { bookId: chapter.book.id, userId: viewer.id },
        select: { id: true },
    });
    if (!purchase) {
        throw ApiError_1.ApiError.forbidden('Achetez ce livre pour lire ce chapitre');
    }
}
// Progression de lecture : un seul enregistrement par (utilisateur, livre),
// écrasé à chaque chapitre effectivement consulté — sert à la fois de
// "reprendre la lecture" (dashboard) et d'indicateur d'activité. Best-effort :
// une erreur ici ne doit jamais faire échouer la lecture du chapitre.
// Le pourcentage n'est remis à 0 que lors d'un changement de chapitre : une
// simple relecture du même chapitre (ex. l'app mobile qui revient au premier
// plan) ne doit pas écraser la position déjà enregistrée via setReadingProgress.
async function recordReadingProgress(userId, bookId, chapterNumber) {
    const existing = await prisma_1.prisma.readBook.findUnique({
        where: { userId_bookId: { userId, bookId } },
        select: { chapterRead: true },
    });
    await prisma_1.prisma.readBook.upsert({
        where: { userId_bookId: { userId, bookId } },
        create: { userId, bookId, chapterRead: chapterNumber, progressPercent: 0 },
        update: {
            chapterRead: chapterNumber,
            readAt: new Date(),
            ...(existing && existing.chapterRead !== chapterNumber ? { progressPercent: 0 } : {}),
        },
    });
}
// Utilisé par le lecteur mobile pour enregistrer la position en cours de
// lecture (scroll/pagination) sans réémettre tout le contenu du chapitre.
// Réapplique le même contrôle d'accès que getChapterForViewer : la
// progression ne doit jamais fuiter/valider un chapitre non autorisé.
async function setReadingProgress(bookId, chapterNumber, progressPercent, viewer) {
    const chapter = await prisma_1.prisma.chapter.findFirst({
        where: { bookId, chapterNumber },
        include: {
            book: { select: { id: true, isFree: true, freeChapterCount: true } },
            part: { select: { id: true, isFree: true, freeChapterCount: true } },
        },
    });
    if (!chapter) {
        throw ApiError_1.ApiError.notFound('Chapitre introuvable');
    }
    await assertChapterAccess(chapter, viewer);
    await prisma_1.prisma.readBook.upsert({
        where: { userId_bookId: { userId: viewer.id, bookId } },
        create: { userId: viewer.id, bookId, chapterRead: chapterNumber, progressPercent },
        update: { chapterRead: chapterNumber, progressPercent, readAt: new Date() },
    });
}
async function getReadingProgress(bookId, userId) {
    return prisma_1.prisma.readBook.findUnique({
        where: { userId_bookId: { userId, bookId } },
        select: { chapterRead: true, progressPercent: true, readAt: true },
    });
}
async function getChapterForViewer(id, viewer) {
    const chapter = await prisma_1.prisma.chapter.findUnique({
        where: { id },
        include: {
            extension: true,
            book: {
                select: { id: true, title: true, authorId: true, isFree: true, freeChapterCount: true },
            },
            part: { select: { id: true, title: true, partNumber: true, isFree: true, freeChapterCount: true, price: true } },
        },
    });
    if (!chapter) {
        throw ApiError_1.ApiError.notFound('Chapitre introuvable');
    }
    await assertChapterAccess(chapter, viewer);
    if (viewer) {
        await recordReadingProgress(viewer.id, chapter.book.id, chapter.chapterNumber);
    }
    return { ...chapter, content: (0, chapter_content_encryption_1.decryptChapterContent)(chapter.content) };
}
async function createChapter(input, actingUser) {
    const book = await getBookOrThrow(input.bookId);
    (0, ownership_1.assertAuthorOwnership)(actingUser, book.authorId);
    await assertPartBelongsToBook(input.partId, input.bookId);
    const { extension, content, ...chapterFields } = input;
    try {
        const chapter = await prisma_1.prisma.chapter.create({
            data: {
                ...chapterFields,
                content: (0, chapter_content_encryption_1.encryptChapterContent)(content),
                ...(extension ? { extension: { create: extension } } : {}),
            },
            include: { extension: true },
        });
        return { ...chapter, content: (0, chapter_content_encryption_1.decryptChapterContent)(chapter.content) };
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw ApiError_1.ApiError.conflict('Ce numéro de chapitre existe déjà pour ce livre');
        }
        throw err;
    }
}
async function updateChapter(id, input, actingUser) {
    const chapter = await getChapterById(id);
    (0, ownership_1.assertAuthorOwnership)(actingUser, chapter.book.authorId);
    await assertPartBelongsToBook(input.partId, chapter.book.id);
    const { extension, content, ...chapterFields } = input;
    try {
        const updatedChapter = await prisma_1.prisma.chapter.update({
            where: { id },
            data: {
                ...chapterFields,
                ...(content !== undefined ? { content: (0, chapter_content_encryption_1.encryptChapterContent)(content) } : {}),
                ...(extension ? { extension: { upsert: { create: extension, update: extension } } } : {}),
            },
            include: { extension: true },
        });
        return { ...updatedChapter, content: (0, chapter_content_encryption_1.decryptChapterContent)(updatedChapter.content) };
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw ApiError_1.ApiError.conflict('Ce numéro de chapitre existe déjà pour ce livre');
        }
        throw err;
    }
}
async function deleteChapter(id, actingUser) {
    const chapter = await getChapterById(id);
    (0, ownership_1.assertAuthorOwnership)(actingUser, chapter.book.authorId);
    await prisma_1.prisma.chapter.delete({ where: { id } });
}
//# sourceMappingURL=chapters.service.js.map