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
exports.authorsRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const authors_schema_1 = require("./authors.schema");
const authorsController = __importStar(require("./authors.controller"));
// TODO: suivre le pattern auth/users. Endpoints attendus (cf. authorController.js legacy) :
//   GET    /                  liste des auteurs (public)
//   GET    /:id               profil auteur (+ extension, livres, stats income)
//   POST   /register          inscription auteur (email + password -> bcrypt)
//   PATCH  /:id                mise à jour profil / extension
// Note : authorabipek (Next.js) utilise Clerk pour l'auth UI — à décider si on
// vérifie aussi les JWT Clerk côté API ou si on garde un système dédié séparé.
exports.authorsRouter = (0, express_1.Router)();
exports.authorsRouter.get('/', (_req, res) => {
    res.status(501).json({ success: false, message: 'Non implémenté : GET /authors' });
});
// KYC : volontairement PAS gardé par requireAuthorKyc, sous peine de ne
// jamais pouvoir le soumettre (poule/œuf) — cf. middlewares/authorKyc.middleware.ts.
exports.authorsRouter.get('/moi/kyc', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author'), (0, asyncHandler_1.asyncHandler)(authorsController.getMyKycHandler));
exports.authorsRouter.post('/moi/kyc', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author'), (0, validate_middleware_1.validate)(authors_schema_1.kycSchema), (0, asyncHandler_1.asyncHandler)(authorsController.submitKycHandler));
// Espace admin : file de vérification KYC.
exports.authorsRouter.get('/kyc', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('admin'), (0, asyncHandler_1.asyncHandler)(authorsController.listAuthorsForKycReviewHandler));
exports.authorsRouter.get('/kyc-bypass', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('admin'), (0, asyncHandler_1.asyncHandler)(authorsController.getAuthorKycBypassPolicyHandler));
exports.authorsRouter.patch('/kyc-bypass', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('admin'), (0, validate_middleware_1.validate)(authors_schema_1.kycBypassSchema), (0, asyncHandler_1.asyncHandler)(authorsController.setAuthorKycBypassPolicyHandler));
exports.authorsRouter.patch('/:authorId/kyc-verification', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('admin'), (0, validate_middleware_1.validate)(authors_schema_1.authorIdParamSchema, 'params'), (0, validate_middleware_1.validate)(authors_schema_1.kycVerificationSchema), (0, asyncHandler_1.asyncHandler)(authorsController.setAuthorKycVerificationHandler));
//# sourceMappingURL=authors.routes.js.map