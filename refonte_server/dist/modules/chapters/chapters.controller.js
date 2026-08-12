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
exports.listChaptersByBookHandler = listChaptersByBookHandler;
exports.getChapterHandler = getChapterHandler;
exports.getChapterForManageHandler = getChapterForManageHandler;
exports.createChapterHandler = createChapterHandler;
exports.updateChapterHandler = updateChapterHandler;
exports.deleteChapterHandler = deleteChapterHandler;
const chaptersService = __importStar(require("./chapters.service"));
async function listChaptersByBookHandler(req, res) {
    const { bookId } = req.params;
    const chapters = await chaptersService.listChaptersByBook(bookId);
    res.json({ success: true, data: chapters });
}
async function getChapterHandler(req, res) {
    const { id } = req.params;
    const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
    const chapter = await chaptersService.getChapterForViewer(id, viewer);
    res.json({ success: true, data: chapter });
}
async function getChapterForManageHandler(req, res) {
    const { id } = req.params;
    const chapter = await chaptersService.getChapterForManage(id, req.user);
    res.json({ success: true, data: chapter });
}
async function createChapterHandler(req, res) {
    const chapter = await chaptersService.createChapter(req.body, req.user);
    res.status(201).json({ success: true, data: chapter });
}
async function updateChapterHandler(req, res) {
    const { id } = req.params;
    const chapter = await chaptersService.updateChapter(id, req.body, req.user);
    res.json({ success: true, data: chapter });
}
async function deleteChapterHandler(req, res) {
    const { id } = req.params;
    await chaptersService.deleteChapter(id, req.user);
    res.status(204).send();
}
//# sourceMappingURL=chapters.controller.js.map