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
exports.bookEpubReaderRouter = exports.bookEpubEditionsRouter = exports.epubEditionsRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const authorKyc_middleware_1 = require("../../middlewares/authorKyc.middleware");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const epub_schema_1 = require("./epub.schema");
const epubController = __importStar(require("./epub.controller"));
exports.epubEditionsRouter = (0, express_1.Router)();
exports.epubEditionsRouter.get('/:id/download', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(epub_schema_1.epubEditionIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(epubController.downloadEpubEditionHandler));
exports.bookEpubEditionsRouter = (0, express_1.Router)();
// Middleware passé directement à chaque route (pas via .use() sans chemin) :
// un .use() non scopé s'appliquerait à TOUT /books/* qui transite par ce
// router, y compris les requêtes destinées à bookEpubReaderRouter/
// bookReadingProgressRouter montés au même préfixe (bug constaté : un lecteur
// recevait 403 sur /books/:id/reading-progress à cause de ce garde auteur).
const requireAuthorAccess = [auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc];
exports.bookEpubEditionsRouter.get('/:id/epub-editions', ...requireAuthorAccess, (0, validate_middleware_1.validate)(epub_schema_1.epubEditionIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(epubController.listEpubEditionsHandler));
exports.bookEpubEditionsRouter.post('/:id/epub-editions', ...requireAuthorAccess, (0, validate_middleware_1.validate)(epub_schema_1.epubEditionIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(epubController.createEpubEditionHandler));
// Distinct de bookEpubEditionsRouter ci-dessus : accessible à tout utilisateur
// authentifié (pas seulement l'auteur/admin), pour que l'app mobile lecteur
// puisse savoir si une édition à jour existe avant de proposer le
// téléchargement — sans droit de déclencher une génération ni voir l'historique.
exports.bookEpubReaderRouter = (0, express_1.Router)();
exports.bookEpubReaderRouter.get('/:id/epub-editions/current', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(epub_schema_1.epubEditionIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(epubController.getCurrentEpubEditionHandler));
//# sourceMappingURL=epub.routes.js.map