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
exports.pointsRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const points_schema_1 = require("./points.schema");
const pointsController = __importStar(require("./points.controller"));
exports.pointsRouter = (0, express_1.Router)();
exports.pointsRouter.get('/balance', auth_middleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(pointsController.getBalanceHandler));
exports.pointsRouter.get('/transactions', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(points_schema_1.listTransactionsQuerySchema, 'query'), (0, asyncHandler_1.asyncHandler)(pointsController.listTransactionsHandler));
exports.pointsRouter.get('/earn/rewarded-ad', auth_middleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(pointsController.getRewardedAdStatusHandler));
exports.pointsRouter.post('/earn/rewarded-ad', auth_middleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(pointsController.creditRewardedAdHandler));
exports.pointsRouter.get('/checkin', auth_middleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(pointsController.getCheckInStatusHandler));
exports.pointsRouter.post('/checkin', auth_middleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(pointsController.performCheckInHandler));
exports.pointsRouter.get('/articles', auth_middleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(pointsController.getArticlesStatusHandler));
exports.pointsRouter.post('/articles/:articleId/read', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(points_schema_1.articleIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(pointsController.markArticleReadHandler));
exports.pointsRouter.get('/reading-time', auth_middleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(pointsController.getReadingTimeStatusHandler));
exports.pointsRouter.post('/reading-time', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(points_schema_1.addReadingTimeSchema, 'body'), (0, asyncHandler_1.asyncHandler)(pointsController.addReadingTimeHandler));
//# sourceMappingURL=points.routes.js.map