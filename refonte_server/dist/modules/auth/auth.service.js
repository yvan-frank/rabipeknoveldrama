"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.registerAuthor = registerAuthor;
exports.login = login;
exports.refreshAccessToken = refreshAccessToken;
exports.revokeRefreshToken = revokeRefreshToken;
const bcrypt_1 = __importDefault(require("bcrypt"));
const node_crypto_1 = require("node:crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../lib/prisma");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../utils/ApiError");
const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 48;
// JWT posé dans le cookie httpOnly web — durée longue, comportement historique
// inchangé pour ne pas dégrader les sessions web existantes.
function signToken(user) {
    const options = { expiresIn: env_1.env.JWT_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(user, env_1.env.JWT_SECRET, options);
}
// JWT d'accès renvoyé en JSON (Bearer, app mobile) — même forme que signToken
// mais volontairement courte durée de vie, cf. commentaire dans config/env.ts.
function signAccessToken(user) {
    const options = { expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(user, env_1.env.JWT_SECRET, options);
}
function hashRefreshToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
function accountTypeFor(user) {
    return user.role === 'author' ? 'author' : 'user';
}
// Émet un refresh token opaque (jamais un JWT : il doit être révocable côté
// serveur) et n'en stocke que le hash SHA-256, à la manière d'un mot de passe.
async function issueRefreshToken(user) {
    const token = (0, node_crypto_1.randomBytes)(REFRESH_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + env_1.env.JWT_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await prisma_1.prisma.refreshToken.create({
        data: { tokenHash: hashRefreshToken(token), accountType: accountTypeFor(user), accountId: user.id, expiresAt },
    });
    return token;
}
async function issueMobileTokens(user) {
    const [accessToken, refreshToken] = [signAccessToken(user), await issueRefreshToken(user)];
    return { accessToken, refreshToken };
}
async function loadAuthUser(accountType, accountId) {
    if (accountType === 'author') {
        const author = await prisma_1.prisma.author.findUnique({ where: { id: accountId }, select: { id: true, email: true } });
        if (!author)
            throw ApiError_1.ApiError.unauthorized('Compte introuvable');
        return { id: author.id, email: author.email, role: 'author', authorId: author.id };
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: accountId }, select: { id: true, email: true, isAdmin: true } });
    if (!user)
        throw ApiError_1.ApiError.unauthorized('Compte introuvable');
    return { id: user.id, email: user.email, role: user.isAdmin ? 'admin' : 'user' };
}
async function register(input) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
        throw ApiError_1.ApiError.conflict('Un compte existe deja avec cet email');
    }
    const passwordHash = await bcrypt_1.default.hash(input.password, SALT_ROUNDS);
    const user = await prisma_1.prisma.user.create({
        data: { name: input.name, email: input.email, passwordHash },
    });
    const authUser = { id: user.id, email: user.email, role: user.isAdmin ? 'admin' : 'user' };
    return { user: authUser, token: signToken(authUser), ...(await issueMobileTokens(authUser)) };
}
async function registerAuthor(input) {
    const [existingUser, existingAuthor] = await Promise.all([
        prisma_1.prisma.user.findUnique({ where: { email: input.email } }),
        prisma_1.prisma.author.findUnique({ where: { email: input.email } }),
    ]);
    if (existingUser || existingAuthor) {
        throw ApiError_1.ApiError.conflict('Un compte existe deja avec cet email');
    }
    const validGenreCount = await prisma_1.prisma.category.count({ where: { id: { in: input.genreIds } } });
    if (validGenreCount !== input.genreIds.length) {
        throw ApiError_1.ApiError.badRequest('Un ou plusieurs genres sélectionnés sont invalides');
    }
    const passwordHash = await bcrypt_1.default.hash(input.password, SALT_ROUNDS);
    const author = await prisma_1.prisma.author.create({
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
    await prisma_1.prisma.authorExtension.create({ data: { authorId: author.id, fullName: input.fullName } });
    const authUser = { id: author.id, email: author.email, role: 'author', authorId: author.id };
    return { user: authUser, token: signToken(authUser), ...(await issueMobileTokens(authUser)) };
}
async function login(input) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
    if (user) {
        const isValid = await bcrypt_1.default.compare(input.password, user.passwordHash);
        if (!isValid) {
            throw ApiError_1.ApiError.unauthorized('Email ou mot de passe incorrect');
        }
        const authUser = {
            id: user.id,
            email: user.email,
            role: user.isAdmin ? 'admin' : 'user',
        };
        return { user: authUser, token: signToken(authUser), ...(await issueMobileTokens(authUser)) };
    }
    const author = await prisma_1.prisma.author.findUnique({ where: { email: input.email } });
    if (!author || !(await bcrypt_1.default.compare(input.password, author.passwordHash))) {
        throw ApiError_1.ApiError.unauthorized('Email ou mot de passe incorrect');
    }
    const authUser = {
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
async function refreshAccessToken(refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await prisma_1.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        throw ApiError_1.ApiError.unauthorized('Session mobile expirée, reconnectez-vous');
    }
    const authUser = await loadAuthUser(stored.accountType, stored.accountId);
    await prisma_1.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const newRefreshToken = await issueRefreshToken(authUser);
    return { user: authUser, accessToken: signAccessToken(authUser), refreshToken: newRefreshToken };
}
// Déconnexion mobile explicite : révoque le refresh token pour qu'un jeton
// intercepté ne puisse plus être échangé contre un nouvel access token.
async function revokeRefreshToken(refreshToken) {
    await prisma_1.prisma.refreshToken.updateMany({
        where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
    });
}
//# sourceMappingURL=auth.service.js.map