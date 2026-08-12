import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { assertAuthorOwnership } from '../../utils/ownership';
import { decryptChapterContent, encryptChapterContent } from '../../utils/chapter-content-encryption';
import type { AuthUser } from '../auth/auth.types';
import type { CreateChapterInput, UpdateChapterInput } from './chapters.schema';

async function getBookOrThrow(bookId: number) {
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true, authorId: true } });
  if (!book) {
    throw ApiError.notFound('Livre introuvable');
  }
  return book;
}

// Contenu volontairement exclu de la liste : potentiellement très volumineux
// (longtext) et inutile pour un sommaire de chapitres.
export async function listChaptersByBook(bookId: number) {
  await getBookOrThrow(bookId);

  return prisma.chapter.findMany({
    where: { bookId },
    select: { id: true, title: true, chapterNumber: true, partId: true },
    orderBy: { chapterNumber: 'asc' },
  });
}

async function assertPartBelongsToBook(partId: number | null | undefined, bookId: number) {
  if (partId === undefined || partId === null) return;
  const part = await prisma.bookPart.findFirst({ where: { id: partId, bookId }, select: { id: true } });
  if (!part) throw ApiError.badRequest('Cette partie ne correspond pas au livre du chapitre');
}

// Version "légère" utilisée en interne (ownership checks d'update/delete) —
// sans vérification d'accès lecteur. cf. getChapterForViewer pour la
// version publique qui applique le paywall.
export async function getChapterById(id: number) {
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: {
      extension: true,
      part: { select: { id: true, title: true, partNumber: true, isFree: true, freeChapterCount: true, price: true } },
      book: { select: { id: true, title: true, authorId: true } },
    },
  });

  if (!chapter) {
    throw ApiError.notFound('Chapitre introuvable');
  }

  return chapter;
}

// Espace auteur : récupérer un chapitre complet (contenu inclus) pour
// édition, avec vérification d'ownership — distinct de getChapterForViewer
// (paywall lecteur, jamais pertinent pour l'auteur qui gère son propre livre).
export async function getChapterForManage(id: number, actingUser: AuthUser) {
  const chapter = await getChapterById(id);
  assertAuthorOwnership(actingUser, chapter.book.authorId);
  return { ...chapter, content: decryptChapterContent(chapter.content) };
}

interface ChapterViewer {
  id: number;
  role: string;
}

// Paywall : la lecture exige toujours d'être connecté, y compris pour un
// livre gratuit ou les `freeChapterCount` premiers chapitres d'un livre
// payant (401 si anonyme). Une fois connecté, ces chapitres "aperçu" restent
// lisibles sans achat ; au-delà, il faut avoir acheté le livre (403 sinon) —
// les admins passent toujours. Pas de vérification pour le rôle 'author' :
// ce rôle n'a pas encore de session JWT possible sur ce serveur (cf. README),
// donc jamais présent dans `viewer` en pratique pour l'instant.
async function assertChapterAccess(
  chapter: {
    chapterNumber: number;
    partId: number | null;
    part: { id: number; isFree: boolean; freeChapterCount: number } | null;
    book: { id: number; isFree: boolean; freeChapterCount: number };
  },
  viewer?: ChapterViewer,
) {
  if (!viewer) {
    throw ApiError.unauthorized('Connectez-vous pour lire ce chapitre');
  }

  if (viewer.role === 'admin') return;

  if (chapter.part && chapter.partId) {
    if (chapter.part.isFree) return;
    const precedingChapterCount = await prisma.chapter.count({
      where: { partId: chapter.partId, chapterNumber: { lte: chapter.chapterNumber } },
    });
    if (precedingChapterCount <= chapter.part.freeChapterCount) return;

    const partPurchase = await prisma.achat.findFirst({
      where: { userId: viewer.id, OR: [{ partId: chapter.partId }, { bookId: chapter.book.id, partId: null }] },
      select: { id: true },
    });
    if (!partPurchase) throw ApiError.forbidden('Achetez cette partie pour lire ce chapitre');
    return;
  }

  if (chapter.book.isFree) return;
  if (chapter.chapterNumber <= chapter.book.freeChapterCount) return;

  const purchase = await prisma.achat.findFirst({
    where: { bookId: chapter.book.id, userId: viewer.id },
    select: { id: true },
  });

  if (!purchase) {
    throw ApiError.forbidden('Achetez ce livre pour lire ce chapitre');
  }
}

// Progression de lecture : un seul enregistrement par (utilisateur, livre),
// écrasé à chaque chapitre effectivement consulté — sert à la fois de
// "reprendre la lecture" (dashboard) et d'indicateur d'activité. Best-effort :
// une erreur ici ne doit jamais faire échouer la lecture du chapitre.
async function recordReadingProgress(userId: number, bookId: number, chapterNumber: number) {
  await prisma.readBook.upsert({
    where: { userId_bookId: { userId, bookId } },
    create: { userId, bookId, chapterRead: chapterNumber },
    update: { chapterRead: chapterNumber, readAt: new Date() },
  });
}

export async function getChapterForViewer(id: number, viewer?: ChapterViewer) {
  const chapter = await prisma.chapter.findUnique({
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
    throw ApiError.notFound('Chapitre introuvable');
  }

  await assertChapterAccess(chapter, viewer);

  if (viewer) {
    await recordReadingProgress(viewer.id, chapter.book.id, chapter.chapterNumber);
  }

  return { ...chapter, content: decryptChapterContent(chapter.content) };
}

export async function createChapter(input: CreateChapterInput, actingUser: AuthUser) {
  const book = await getBookOrThrow(input.bookId);
  assertAuthorOwnership(actingUser, book.authorId);
  await assertPartBelongsToBook(input.partId, input.bookId);

  const { extension, content, ...chapterFields } = input;

  try {
    const chapter = await prisma.chapter.create({
      data: {
        ...chapterFields,
        content: encryptChapterContent(content),
        ...(extension ? { extension: { create: extension } } : {}),
      },
      include: { extension: true },
    });
    return { ...chapter, content: decryptChapterContent(chapter.content) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw ApiError.conflict('Ce numéro de chapitre existe déjà pour ce livre');
    }
    throw err;
  }
}

export async function updateChapter(id: number, input: UpdateChapterInput, actingUser: AuthUser) {
  const chapter = await getChapterById(id);
  assertAuthorOwnership(actingUser, chapter.book.authorId);
  await assertPartBelongsToBook(input.partId, chapter.book.id);

  const { extension, content, ...chapterFields } = input;

  try {
    const updatedChapter = await prisma.chapter.update({
      where: { id },
      data: {
        ...chapterFields,
        ...(content !== undefined ? { content: encryptChapterContent(content) } : {}),
        ...(extension ? { extension: { upsert: { create: extension, update: extension } } } : {}),
      },
      include: { extension: true },
    });
    return { ...updatedChapter, content: decryptChapterContent(updatedChapter.content) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw ApiError.conflict('Ce numéro de chapitre existe déjà pour ce livre');
    }
    throw err;
  }
}

export async function deleteChapter(id: number, actingUser: AuthUser) {
  const chapter = await getChapterById(id);
  assertAuthorOwnership(actingUser, chapter.book.authorId);

  await prisma.chapter.delete({ where: { id } });
}
