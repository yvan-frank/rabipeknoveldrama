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
exports.commentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const comments_schema_1 = require("./comments.schema");
const commentsController = __importStar(require("./comments.controller"));
exports.commentsRouter = (0, express_1.Router)();
exports.commentsRouter.get('/book/:bookId', (0, validate_middleware_1.validate)(comments_schema_1.bookIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(commentsController.listBookReviewsHandler));
exports.commentsRouter.post('/book/:bookId', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(comments_schema_1.bookIdParamSchema, 'params'), (0, validate_middleware_1.validate)(comments_schema_1.upsertReviewSchema), (0, asyncHandler_1.asyncHandler)(commentsController.upsertBookReviewHandler));
exports.commentsRouter.post('/review/:commentId/reply', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), (0, validate_middleware_1.validate)(zod_1.z.object({ commentId: zod_1.z.coerce.number().int().positive() }), 'params'), (0, validate_middleware_1.validate)(comments_schema_1.replyToReviewSchema), (0, asyncHandler_1.asyncHandler)(commentsController.replyToBookReviewHandler));
// Fil de discussion par chapitre. Réservé aux lecteurs authentifiés (User)
// pour l'instant — les comptes Author n'ont pas encore de système d'auth
// câblé sur ce serveur (cf. README), donc pas de distinction "réponse
// d'auteur" possible côté API tant que ce chantier n'est pas fait.
exports.commentsRouter.get('/chapter/:chapterId', (0, validate_middleware_1.validate)(comments_schema_1.chapterIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(commentsController.listChapterCommentsHandler));
exports.commentsRouter.post('/chapter/:chapterId', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(comments_schema_1.chapterIdParamSchema, 'params'), (0, validate_middleware_1.validate)(comments_schema_1.createChapterCommentSchema), (0, asyncHandler_1.asyncHandler)(commentsController.createChapterCommentHandler));
exports.commentsRouter.delete('/chapter-comment/:commentId', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(comments_schema_1.chapterCommentIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(commentsController.deleteChapterCommentHandler));
//# sourceMappingURL=comments.routes.js.map