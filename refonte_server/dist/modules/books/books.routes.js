"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.booksRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const authorKyc_middleware_1 = require("../../middlewares/authorKyc.middleware");
const books_schema_1 = require("./books.schema");
const booksController = __importStar(require("./books.controller"));
exports.booksRouter = (0, express_1.Router)();
exports.booksRouter.get('/', (0, validate_middleware_1.validate)(books_schema_1.listBooksQuerySchema, 'query'), (0, asyncHandler_1.asyncHandler)(booksController.listBooksHandler));
// Chemin à un seul segment comme `/mine` ci-dessous : doit précéder `/:slug`
// pour ne pas en être capturé (Express matche dans l'ordre de déclaration).
exports.booksRouter.get('/top-rated', (0, validate_middleware_1.validate)(books_schema_1.topRatedBooksQuerySchema, 'query'), (0, asyncHandler_1.asyncHandler)(booksController.getTopRatedBooksHandler));
exports.booksRouter.post('/:id/grants', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(books_schema_1.bookIdParamSchema, 'params'), (0, validate_middleware_1.validate)(books_schema_1.grantBookToEmailSchema), (0, asyncHandler_1.asyncHandler)(booksController.grantBookToReaderHandler));
exports.booksRouter.get('/administration/catalogue', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('admin'), (0, asyncHandler_1.asyncHandler)(booksController.listBooksForAdminHandler));
exports.booksRouter.patch('/:id/moderation', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('admin'), (0, validate_middleware_1.validate)(books_schema_1.bookIdParamSchema, 'params'), (0, validate_middleware_1.validate)(books_schema_1.moderateBookSchema), (0, asyncHandler_1.asyncHandler)(booksController.moderateBookHandler));
// Espace auteur : mes livres + détail par id pour édition — chemins à deux
// segments, donc jamais capturés par `/:slug` ci-dessous (un seul segment).
exports.booksRouter.get('/mine', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), (0, asyncHandler_1.asyncHandler)(booksController.listMyBooksHandler));
exports.booksRouter.get('/manage/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), (0, validate_middleware_1.validate)(books_schema_1.bookIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(booksController.getBookForManageHandler));
// Détail public par slug (SEO) — distinct des routes /:id ci-dessous, qui
// restent en identifiant numérique pour les actions internes authentifiées
// (update/delete), inchangées par le passage aux URLs nominatives.
exports.booksRouter.get('/:slug', auth_middleware_1.optionalAuth, (0, validate_middleware_1.validate)(books_schema_1.bookSlugParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(booksController.getBookHandler));
exports.booksRouter.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(books_schema_1.createBookSchema), (0, asyncHandler_1.asyncHandler)(booksController.createBookHandler));
exports.booksRouter.patch('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(books_schema_1.bookIdParamSchema, 'params'), (0, validate_middleware_1.validate)(books_schema_1.updateBookSchema), (0, asyncHandler_1.asyncHandler)(booksController.updateBookHandler));
exports.booksRouter.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(books_schema_1.bookIdParamSchema, 'params'), (0, validate_middleware_1.validate)(books_schema_1.deleteBookSchema), (0, asyncHandler_1.asyncHandler)(booksController.deleteBookHandler));
//# sourceMappingURL=books.routes.js.map