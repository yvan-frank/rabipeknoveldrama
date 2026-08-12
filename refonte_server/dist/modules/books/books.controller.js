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
exports.listBooksHandler = listBooksHandler;
exports.getTopRatedBooksHandler = getTopRatedBooksHandler;
exports.getBookHandler = getBookHandler;
exports.listMyBooksHandler = listMyBooksHandler;
exports.listBooksForAdminHandler = listBooksForAdminHandler;
exports.moderateBookHandler = moderateBookHandler;
exports.getBookForManageHandler = getBookForManageHandler;
exports.grantBookToReaderHandler = grantBookToReaderHandler;
exports.createBookHandler = createBookHandler;
exports.updateBookHandler = updateBookHandler;
exports.deleteBookHandler = deleteBookHandler;
const booksService = __importStar(require("./books.service"));
async function listBooksHandler(req, res) {
    const result = await booksService.listBooks(req.query);
    res.json({ success: true, data: result });
}
async function getTopRatedBooksHandler(req, res) {
    const { limit } = req.query;
    const books = await booksService.getTopRatedBooks(limit);
    res.json({ success: true, data: books });
}
async function getBookHandler(req, res) {
    const { slug } = req.params;
    const countryHeader = req.get('cf-ipcountry') ?? req.get('x-vercel-ip-country') ?? undefined;
    const book = await booksService.getBookDetailForViewer(slug, req.user?.id, {
        userId: req.user?.id,
        ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
        userAgent: req.get('user-agent') ?? undefined,
        country: countryHeader,
    });
    res.json({ success: true, data: book });
}
async function listMyBooksHandler(req, res) {
    const books = await booksService.listMyBooks(req.user);
    res.json({ success: true, data: books });
}
async function listBooksForAdminHandler(_req, res) { res.json({ success: true, data: await booksService.listBooksForAdmin() }); }
async function moderateBookHandler(req, res) { const { id } = req.params; const { action } = req.body; const book = await booksService.moderateBook(id, action); res.json({ success: true, data: book }); }
async function getBookForManageHandler(req, res) {
    const { id } = req.params;
    const book = await booksService.getBookForManage(id, req.user);
    res.json({ success: true, data: book });
}
async function grantBookToReaderHandler(req, res) {
    const { id } = req.params;
    const grant = await booksService.grantBookToReader(id, req.body, req.user);
    res.status(201).json({ success: true, data: grant });
}
async function createBookHandler(req, res) {
    const book = await booksService.createBook(req.body, req.user);
    res.status(201).json({ success: true, data: book });
}
async function updateBookHandler(req, res) {
    const { id } = req.params;
    const book = await booksService.updateBook(id, req.body, req.user);
    res.json({ success: true, data: book });
}
async function deleteBookHandler(req, res) {
    const { id } = req.params;
    await booksService.deleteBook(id, req.user);
    res.status(204).send();
}
//# sourceMappingURL=books.controller.js.map