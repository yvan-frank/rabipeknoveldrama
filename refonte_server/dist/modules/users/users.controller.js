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
exports.listUsersHandler = listUsersHandler;
exports.getUserHandler = getUserHandler;
exports.listBookGrantsHandler = listBookGrantsHandler;
exports.revokeBookGrantHandler = revokeBookGrantHandler;
exports.deleteUserHandler = deleteUserHandler;
exports.grantBookHandler = grantBookHandler;
exports.getMyDashboardHandler = getMyDashboardHandler;
exports.getAdminDashboardHandler = getAdminDashboardHandler;
const usersService = __importStar(require("./users.service"));
async function listUsersHandler(req, res) {
    const result = await usersService.listUsers(req.query);
    res.json({ success: true, data: result });
}
async function getUserHandler(req, res) {
    const { id } = req.params;
    const user = await usersService.getUserById(id);
    res.json({ success: true, data: user });
}
async function listBookGrantsHandler(req, res) {
    const result = await usersService.listBookGrants(req.query);
    res.json({ success: true, data: result });
}
async function revokeBookGrantHandler(req, res) {
    const { grantId } = req.params;
    await usersService.revokeBookGrant(grantId);
    res.status(204).send();
}
async function deleteUserHandler(req, res) {
    const { id } = req.params;
    await usersService.softDeleteUser(id);
    res.status(204).send();
}
async function grantBookHandler(req, res) {
    const { id } = req.params;
    const grant = await usersService.grantBookToUser(id, req.body, req.user.id);
    res.status(201).json({ success: true, data: grant });
}
async function getMyDashboardHandler(req, res) {
    const dashboard = await usersService.getUserDashboard(req.user.id);
    res.json({ success: true, data: dashboard });
}
async function getAdminDashboardHandler(_req, res) {
    const dashboard = await usersService.getAdminDashboard();
    res.json({ success: true, data: dashboard });
}
//# sourceMappingURL=users.controller.js.map