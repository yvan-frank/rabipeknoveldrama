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
exports.uploadsRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const uploadsController = __importStar(require("./uploads.controller"));
exports.uploadsRouter = (0, express_1.Router)();
// Upload découplé de la création du livre : le formulaire (assistant en
// plusieurs étapes) envoie l'image dès sa sélection et récupère une URL,
// utilisée ensuite comme n'importe quel champ `cover` texte lors de POST/PATCH /books.
exports.uploadsRouter.post('/cover', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), upload_middleware_1.uploadCoverImage, (0, asyncHandler_1.asyncHandler)(uploadsController.uploadCoverHandler));
// Sciemment PAS gardé par requireAuthorKyc : c'est justement l'upload de la
// pièce d'identité qui permet de compléter le KYC.
exports.uploadsRouter.post('/document', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), upload_middleware_1.uploadIdentityDocument, (0, asyncHandler_1.asyncHandler)(uploadsController.uploadDocumentHandler));
//# sourceMappingURL=uploads.routes.js.map