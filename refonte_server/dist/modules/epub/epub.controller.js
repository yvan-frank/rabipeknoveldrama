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
exports.createEpubEditionHandler = createEpubEditionHandler;
exports.listEpubEditionsHandler = listEpubEditionsHandler;
exports.getCurrentEpubEditionHandler = getCurrentEpubEditionHandler;
exports.downloadEpubEditionHandler = downloadEpubEditionHandler;
const epubService = __importStar(require("./epub.service"));
const epub_worker_1 = require("./epub.worker");
async function createEpubEditionHandler(req, res) {
    const { id } = req.params;
    const edition = await epubService.requestEpubGeneration(id, req.user);
    (0, epub_worker_1.queueEpubGeneration)(edition.id);
    res.status(202).json({ success: true, data: edition });
}
async function listEpubEditionsHandler(req, res) {
    const { id } = req.params;
    const editions = await epubService.listEpubEditions(id, req.user);
    res.json({ success: true, data: editions });
}
async function getCurrentEpubEditionHandler(req, res) {
    const { id } = req.params;
    const edition = await epubService.getCurrentReadyEditionForReader(id);
    res.json({ success: true, data: edition });
}
async function downloadEpubEditionHandler(req, res) {
    const { id } = req.params;
    const file = await epubService.getEpubDownload(id, req.user);
    res.setHeader('Content-Type', 'application/epub+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename.replace(/[^\x20-\x7e]/g, '')}"`);
    if (file.contentLength)
        res.setHeader('Content-Length', String(file.contentLength));
    file.stream.on('error', () => res.destroy());
    file.stream.pipe(res);
}
//# sourceMappingURL=epub.controller.js.map