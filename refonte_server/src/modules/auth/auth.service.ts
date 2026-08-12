import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import type { LoginInput, RegisterInput, RegisterAuthorInput } from './auth.schema';
import type { AuthUser } from './auth.types';

const SALT_ROUNDS = 12;

function signToken(user: AuthUser) {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(user, env.JWT_SECRET, options);
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('Un compte existe deja avec cet email');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  const authUser: AuthUser = { id: user.id, email: user.email, role: user.isAdmin ? 'admin' : 'user' };
  return { user: authUser, token: signToken(authUser) };
}

export async function registerAuthor(input: RegisterAuthorInput) {
  const [existingUser, existingAuthor] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    prisma.author.findUnique({ where: { email: input.email } }),
  ]);
  if (existingUser || existingAuthor) {
    throw ApiError.conflict('Un compte existe deja avec cet email');
  }

  const validGenreCount = await prisma.category.count({ where: { id: { in: input.genreIds } } });
  if (validGenreCount !== input.genreIds.length) {
    throw ApiError.badRequest('Un ou plusieurs genres sélectionnés sont invalides');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const author = await prisma.author.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      about: input.about,
      genres: input.genreIds,
    },
  });
  // Pré-remplit le nom légal complet pour le futur formulaire KYC (cf.
  // authors.service.ts, submitKyc fait un upsert donc pas de conflit).
  await prisma.authorExtension.create({ data: { authorId: author.id, fullName: input.fullName } });

  const authUser: AuthUser = { id: author.id, email: author.email, role: 'author', authorId: author.id };
  return { user: authUser, token: signToken(authUser) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (user) {
    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.isAdmin ? 'admin' : 'user',
    };
    return { user: authUser, token: signToken(authUser) };
  }

  const author = await prisma.author.findUnique({ where: { email: input.email } });
  if (!author || !(await bcrypt.compare(input.password, author.passwordHash))) {
    throw ApiError.unauthorized('Email ou mot de passe incorrect');
  }

  const authUser: AuthUser = {
    id: author.id,
    email: author.email,
    role: 'author',
    authorId: author.id,
  };
  return { user: authUser, token: signToken(authUser) };
}
