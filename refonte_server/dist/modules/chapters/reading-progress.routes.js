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
exports.bookReadingProgressRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const chapters_schema_1 = require("./chapters.schema");
const chaptersController = __importStar(require("./chapters.controller"));
// Monté sous /books dans routes/index.ts : /books/:id/reading-progress.
// Séparé de chapters.routes.ts car la ressource est le livre, pas le chapitre.
// Middlewares passés par route (pas via .use() sans chemin) : un .use() non
// scopé s'exécute avant qu'Express n'ait fait correspondre `:id/reading-progress`
// et valide donc req.params.id alors qu'il est encore vide (=> NaN, 400 à tort).
exports.bookReadingProgressRouter = (0, express_1.Router)();
exports.bookReadingProgressRouter.get('/:id/reading-progress', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(chapters_schema_1.bookReadingProgressParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(chaptersController.getReadingProgressHandler));
exports.bookReadingProgressRouter.put('/:id/reading-progress', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(chapters_schema_1.bookReadingProgressParamSchema, 'params'), (0, validate_middleware_1.validate)(chapters_schema_1.updateReadingProgressSchema), (0, asyncHandler_1.asyncHandler)(chaptersController.updateReadingProgressHandler));
//# sourceMappingURL=reading-progress.routes.js.map