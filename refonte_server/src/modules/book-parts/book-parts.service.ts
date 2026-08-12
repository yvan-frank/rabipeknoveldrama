import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { assertAuthorOwnership } from '../../utils/ownership';
import type { AuthUser } from '../auth/auth.types';
import type { CreateBookPartInput, UpdateBookPartInput } from './book-parts.schema';

const publicPartSelect = {
  id: true,
  title: true,
  partNumber: true,
  description: true,
  price: true,
  isFree: true,
  freeChapterCount: true,
  chapters: { select: { id: true, title: true, chapterNumber: true, partId: true }, orderBy: { chapterNumber: 'asc' as const } },
} as const;

async function getPartWithBook(id: number) {
  const part = await prisma.bookPart.findUnique({
    where: { id },
    include: { book: { select: { id: true, authorId: true } } },
  });
  if (!part) throw ApiError.notFound('Partie introuvable');
  return part;
}

export async function listBookParts(bookId: number) {
  return prisma.bookPart.findMany({
    where: { bookId },
    select: publicPartSelect,
    orderBy: { partNumber: 'asc' },
  });
}

export async function createBookPart(input: CreateBookPartInput, actingUser: AuthUser) {
  const book = await prisma.book.findUnique({ where: { id: input.bookId }, select: { id: true, authorId: true } });
  if (!book) throw ApiError.notFound('Livre introuvable');
  assertAuthorOwnership(actingUser, book.authorId);

  try {
    return await prisma.bookPart.create({ data: input, select: publicPartSelect });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw ApiError.conflict('Ce numéro de partie existe déjà pour ce livre');
    }
    throw error;
  }
}

export async function updateBookPart(id: number, input: UpdateBookPartInput, actingUser: AuthUser) {
  const part = await getPartWithBook(id);
  assertAuthorOwnership(actingUser, part.book.authorId);

  try {
    return await prisma.bookPart.update({ where: { id }, data: input, select: publicPartSelect });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw ApiError.conflict('Ce numéro de partie existe déjà pour ce livre');
    }
    throw error;
  }
}

export async function deleteBookPart(id: number, actingUser: AuthUser) {
  const part = await getPartWithBook(id);
  assertAuthorOwnership(actingUser, part.book.authorId);

  try {
    await prisma.bookPart.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw ApiError.conflict('Impossible de supprimer une partie déjà achetée');
    }
    throw error;
  }
}
