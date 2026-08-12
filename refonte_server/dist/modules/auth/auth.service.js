"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.registerAuthor = registerAuthor;
exports.login = login;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../lib/prisma");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../utils/ApiError");
const SALT_ROUNDS = 12;
function signToken(user) {
    const options = { expiresIn: env_1.env.JWT_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(user, env_1.env.JWT_SECRET, options);
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
    return { user: authUser, token: signToken(authUser) };
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
    return { user: authUser, token: signToken(authUser) };
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
        return { user: authUser, token: signToken(authUser) };
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
    return { user: authUser, token: signToken(authUser) };
}
//# sourceMappingURL=auth.service.js.map