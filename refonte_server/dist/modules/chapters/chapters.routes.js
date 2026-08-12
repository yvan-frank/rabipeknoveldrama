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
exports.chaptersRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const authorKyc_middleware_1 = require("../../middlewares/authorKyc.middleware");
const chapters_schema_1 = require("./chapters.schema");
const chaptersController = __importStar(require("./chapters.controller"));
exports.chaptersRouter = (0, express_1.Router)();
exports.chaptersRouter.get('/book/:bookId', (0, validate_middleware_1.validate)(chapters_schema_1.bookIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(chaptersController.listChaptersByBookHandler));
// Espace auteur : chapitre complet (contenu inclus) pour édition, sans le
// paywall lecteur — chemin à deux segments, jamais capturé par `/:id` ci-dessous.
exports.chaptersRouter.get('/manage/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), (0, validate_middleware_1.validate)(chapters_schema_1.chapterIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(chaptersController.getChapterForManageHandler));
exports.chaptersRouter.get('/:id', auth_middleware_1.optionalAuth, (0, validate_middleware_1.validate)(chapters_schema_1.chapterIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(chaptersController.getChapterHandler));
exports.chaptersRouter.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(chapters_schema_1.createChapterSchema), (0, asyncHandler_1.asyncHandler)(chaptersController.createChapterHandler));
exports.chaptersRouter.patch('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(chapters_schema_1.chapterIdParamSchema, 'params'), (0, validate_middleware_1.validate)(chapters_schema_1.updateChapterSchema), (0, asyncHandler_1.asyncHandler)(chaptersController.updateChapterHandler));
exports.chaptersRouter.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(chapters_schema_1.chapterIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(chaptersController.deleteChapterHandler));
//# sourceMappingURL=chapters.routes.js.map