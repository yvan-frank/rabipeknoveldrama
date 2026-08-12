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
exports.listBookPartsHandler = listBookPartsHandler;
exports.createBookPartHandler = createBookPartHandler;
exports.updateBookPartHandler = updateBookPartHandler;
exports.deleteBookPartHandler = deleteBookPartHandler;
const bookPartsService = __importStar(require("./book-parts.service"));
async function listBookPartsHandler(req, res) {
    const bookId = Number(req.params.bookId);
    const parts = await bookPartsService.listBookParts(bookId);
    res.json({ success: true, data: parts });
}
async function createBookPartHandler(req, res) {
    const part = await bookPartsService.createBookPart(req.body, req.user);
    res.status(201).json({ success: true, data: part });
}
async function updateBookPartHandler(req, res) {
    const { id } = req.params;
    const part = await bookPartsService.updateBookPart(id, req.body, req.user);
    res.json({ success: true, data: part });
}
async function deleteBookPartHandler(req, res) {
    const { id } = req.params;
    await bookPartsService.deleteBookPart(id, req.user);
    res.status(204).send();
}
//# sourceMappingURL=book-parts.controller.js.map