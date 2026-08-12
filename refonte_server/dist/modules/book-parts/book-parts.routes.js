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
exports.bookPartsRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const authorKyc_middleware_1 = require("../../middlewares/authorKyc.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const chapters_schema_1 = require("../chapters/chapters.schema");
const book_parts_schema_1 = require("./book-parts.schema");
const bookPartsController = __importStar(require("./book-parts.controller"));
exports.bookPartsRouter = (0, express_1.Router)();
exports.bookPartsRouter.get('/book/:bookId', (0, validate_middleware_1.validate)(chapters_schema_1.bookIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(bookPartsController.listBookPartsHandler));
exports.bookPartsRouter.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(book_parts_schema_1.createBookPartSchema), (0, asyncHandler_1.asyncHandler)(bookPartsController.createBookPartHandler));
exports.bookPartsRouter.patch('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(book_parts_schema_1.bookPartIdParamSchema, 'params'), (0, validate_middleware_1.validate)(book_parts_schema_1.updateBookPartSchema), (0, asyncHandler_1.asyncHandler)(bookPartsController.updateBookPartHandler));
exports.bookPartsRouter.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('author', 'admin'), authorKyc_middleware_1.requireAuthorKyc, (0, validate_middleware_1.validate)(book_parts_schema_1.bookPartIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(bookPartsController.deleteBookPartHandler));
//# sourceMappingURL=book-parts.routes.js.map