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
exports.cartRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const cart_schema_1 = require("./cart.schema");
const cartController = __importStar(require("./cart.controller"));
// TODO: suivre le pattern auth/users. Toutes les routes nécessitent requireAuth
// (le panier est toujours celui de req.user.id, jamais un id_user passé en paramètre).
//   GET    /            panier de l'utilisateur connecté
//   POST   /            ajouter un livre au panier
//   DELETE /:bookId      retirer un livre
//   DELETE /            vider le panier
exports.cartRouter = (0, express_1.Router)();
exports.cartRouter.use(auth_middleware_1.requireAuth);
exports.cartRouter.get('/', (0, asyncHandler_1.asyncHandler)(cartController.listCartHandler));
exports.cartRouter.post('/', (0, validate_middleware_1.validate)(cart_schema_1.addPartToCartSchema), (0, asyncHandler_1.asyncHandler)(cartController.addPartToCartHandler));
exports.cartRouter.delete('/parties/:partId', (0, validate_middleware_1.validate)(cart_schema_1.cartPartIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(cartController.removePartFromCartHandler));
//# sourceMappingURL=cart.routes.js.map