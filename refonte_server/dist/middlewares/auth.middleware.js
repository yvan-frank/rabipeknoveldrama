"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
// Auth stateless uniquement (JWT signé, pas de table `sessions` côté DB —
// décision prise pour lever l'incohérence "double stratégie d'auth" du legacy).
function requireAuth(req, _res, next) {
    const token = req.cookies?.[env_1.env.COOKIE_NAME];
    if (!token) {
        throw ApiError_1.ApiError.unauthorized();
    }
    try {
        req.user = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        next();
    }
    catch {
        throw ApiError_1.ApiError.unauthorized('Session invalide ou expirée');
    }
}
// Pour les routes publiques qui personnalisent leur réponse si l'appelant
// est connecté (ex. isLikedByUser sur un livre) sans exiger d'authentification.
// Un cookie absent ou invalide n'est pas une erreur ici, contrairement à
// requireAuth — on continue simplement sans req.user.
function optionalAuth(req, _res, next) {
    const token = req.cookies?.[env_1.env.COOKIE_NAME];
    if (token) {
        try {
            req.user = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        }
        catch {
            // Token invalide/expiré : on ignore, la route reste accessible en anonyme.
        }
    }
    next();
}
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            throw ApiError_1.ApiError.unauthorized();
        }
        if (!roles.includes(req.user.role)) {
            throw ApiError_1.ApiError.forbidden();
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map