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
exports.usersRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const users_schema_1 = require("./users.schema");
const usersController = __importStar(require("./users.controller"));
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.get('/moi/tableau-de-bord', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('user'), (0, asyncHandler_1.asyncHandler)(usersController.getMyDashboardHandler));
exports.usersRouter.get('/administration/tableau-de-bord', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('admin'), (0, asyncHandler_1.asyncHandler)(usersController.getAdminDashboardHandler));
exports.usersRouter.use(auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)('admin'));
exports.usersRouter.get('/', (0, validate_middleware_1.validate)(users_schema_1.listUsersQuerySchema, 'query'), (0, asyncHandler_1.asyncHandler)(usersController.listUsersHandler));
exports.usersRouter.get('/book-grants', (0, validate_middleware_1.validate)(users_schema_1.listUsersQuerySchema, 'query'), (0, asyncHandler_1.asyncHandler)(usersController.listBookGrantsHandler));
exports.usersRouter.delete('/book-grants/:grantId', (0, validate_middleware_1.validate)(users_schema_1.bookGrantIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(usersController.revokeBookGrantHandler));
exports.usersRouter.post('/:id/book-grants', (0, validate_middleware_1.validate)(users_schema_1.userIdParamSchema, 'params'), (0, validate_middleware_1.validate)(users_schema_1.grantBookSchema), (0, asyncHandler_1.asyncHandler)(usersController.grantBookHandler));
exports.usersRouter.get('/:id', (0, validate_middleware_1.validate)(users_schema_1.userIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(usersController.getUserHandler));
exports.usersRouter.delete('/:id', (0, validate_middleware_1.validate)(users_schema_1.userIdParamSchema, 'params'), (0, asyncHandler_1.asyncHandler)(usersController.deleteUserHandler));
//# sourceMappingURL=users.routes.js.map