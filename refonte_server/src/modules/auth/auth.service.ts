import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import type { LoginInput, RegisterInput, RegisterAuthorInput } from './auth.schema';
import type { AuthUser } from './auth.types';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 48;

// JWT posé dans le cookie httpOnly web — durée longue, comportement historique
// inchangé pour ne pas dégrader les sessions web existantes.
function signToken(user: AuthUser) {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(user, env.JWT_SECRET, options);
}

// JWT d'accès renvoyé en JSON (Bearer, app mobile) — même forme que signToken
// mais volontairement courte durée de vie, cf. commentaire dans config/env.ts.
function signAccessToken(user: AuthUser) {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(user, env.JWT_SECRET, options);
}

function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function accountTypeFor(user: AuthUser): 'user' | 'author' {
  return user.role === 'author' ? 'author' : 'user';
}

// Émet un refresh token opaque (jamais un JWT : il doit être révocable côté
// serveur) et n'en stocke que le hash SHA-256, à la manière d'un mot de passe.
async function issueRefreshToken(user: AuthUser) {
  const token = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { tokenHash: hashRefreshToken(token), accountType: accountTypeFor(user), accountId: user.id, expiresAt },
  });
  return token;
}

async function issueMobileTokens(user: AuthUser) {
  const [accessToken, refreshToken] = [signAccessToken(user), await issueRefreshToken(user)];
  return { accessToken, refreshToken };
}

async function loadAuthUser(accountType: string, accountId: number): Promise<AuthUser> {
  if (accountType === 'author') {
    const author = await prisma.author.findUnique({ where: { id: accountId }, select: { id: true, email: true } });
    if (!author) throw ApiError.unauthorized('Compte introuvable');
    return { id: author.id, email: author.email, role: 'author', authorId: author.id };
  }

  const user = await prisma.user.findUnique({ where: { id: accountId }, select: { id: true, email: true, isAdmin: true } });
  if (!user) throw ApiError.unauthorized('Compte introuvable');
  return { id: user.id, email: user.email, role: user.isAdmin ? 'admin' : 'user' };
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
  return { user: authUser, token: signToken(authUser), ...(await issueMobileTokens(authUser)) };
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
  return { user: authUser, token: signToken(authUser), ...(await issueMobileTokens(authUser)) };
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
    return { user: authUser, token: signToken(authUser), ...(await issueMobileTokens(authUser)) };
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
  return { user: authUser, token: signToken(authUser), ...(await issueMobileTokens(authUser)) };
}

// Échange un refresh token valide contre un nouvel access token, en le
// faisant tourner (l'ancien est révoqué) pour limiter l'impact d'un vol de
// jeton. Recharge le rôle depuis la base plutôt que de faire confiance à un
// jeton potentiellement ancien (ex. un compte promu admin entre-temps).
export async function refreshAccessToken(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Session mobile expirée, reconnectez-vous');
  }

  const authUser = await loadAuthUser(stored.accountType, stored.accountId);
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const newRefreshToken = await issueRefreshToken(authUser);

  return { user: authUser, accessToken: signAccessToken(authUser), refreshToken: newRefreshToken };
}

// Déconnexion mobile explicite : révoque le refresh token pour qu'un jeton
// intercepté ne puisse plus être échangé contre un nouvel access token.
export async function revokeRefreshToken(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
