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
exports.statsRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const stats_schema_1 = require("./stats.schema");
const statsController = __importStar(require("./stats.controller"));
// TODO: suivre le pattern auth/users. Consolider les 4 tables de vues legacy
// (viewbooks, views_books_by_country, views_books_by_platform, views_book_per_day)
// derrière une seule API de stats, avec `views_book_per_day` comme table de faits
// et les deux autres calculées par agrégation (cf. recommandation de l'audit DB).
//   GET /books/:id/views?from=&to=&groupBy=day|country|platform
//   GET /books/:id/summary   (total vues, likes, partages, lectures, revenus)
//   GET /authors/:id/income  (accessible à l'auteur concerné ou à un admin)
exports.statsRouter = (0, express_1.Router)();
exports.statsRouter.use(auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'));
exports.statsRouter.get('/books/:id/summary', (0, validate_middleware_1.validate)(stats_schema_1.statsBookIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(statsController.getBookStatsSummaryHandler));
exports.statsRouter.get('/books/:id/views', (0, validate_middleware_1.validate)(stats_schema_1.statsBookIdParamSchema, 'params'), (0, validate_middleware_1.validate)(stats_schema_1.viewStatsQuerySchema, 'query'), (0, asyncHandler_1.asyncHandler)(statsController.getBookViewStatsHandler));
exports.statsRouter.get('/books/:id/summary', (_req, res) => {
    res.status(501).json({ success: false, message: 'Non implémenté : GET /stats/books/:id/summary' });
});
//# sourceMappingURL=stats.routes.js.map