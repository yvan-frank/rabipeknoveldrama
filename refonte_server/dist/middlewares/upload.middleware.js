"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCoverImage = uploadCoverImage;
exports.uploadIdentityDocument = uploadIdentityDocument;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const multer_1 = __importDefault(require("multer"));
const ApiError_1 = require("../utils/ApiError");
const COVER_UPLOAD_DIR = node_path_1.default.join(process.cwd(), 'public', 'uploads', 'covers');
const DOCUMENT_UPLOAD_DIR = node_path_1.default.join(process.cwd(), 'public', 'uploads', 'documents');
node_fs_1.default.mkdirSync(COVER_UPLOAD_DIR, { recursive: true });
node_fs_1.default.mkdirSync(DOCUMENT_UPLOAD_DIR, { recursive: true });
const IMAGE_MIME_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};
// Pièce d'identité (KYC auteur) : mêmes formats image, plus PDF pour un scan.
const DOCUMENT_MIME_TYPES = {
    ...IMAGE_MIME_TYPES,
    'application/pdf': 'pdf',
};
function makeStorage(dir, mimeTypes) {
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, dir),
        filename: (_req, file, cb) => {
            const ext = mimeTypes[file.mimetype] ?? 'bin';
            cb(null, `${node_crypto_1.default.randomUUID()}.${ext}`);
        },
    });
}
const coverUpload = (0, multer_1.default)({
    storage: makeStorage(COVER_UPLOAD_DIR, IMAGE_MIME_TYPES),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!IMAGE_MIME_TYPES[file.mimetype]) {
            cb(new Error('UNSUPPORTED_TYPE'));
            return;
        }
        cb(null, true);
    },
});
const documentUpload = (0, multer_1.default)({
    storage: makeStorage(DOCUMENT_UPLOAD_DIR, DOCUMENT_MIME_TYPES),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!DOCUMENT_MIME_TYPES[file.mimetype]) {
            cb(new Error('UNSUPPORTED_TYPE'));
            return;
        }
        cb(null, true);
    },
});
// Multer signale ses erreurs via un callback plutôt qu'une exception —
// on les traduit ici en ApiError pour un message cohérent avec le reste de l'API.
function uploadCoverImage(req, res, next) {
    coverUpload.single('cover')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            next(ApiError_1.ApiError.badRequest('Image trop volumineuse (5 Mo maximum)'));
            return;
        }
        if (err instanceof Error && err.message === 'UNSUPPORTED_TYPE') {
            next(ApiError_1.ApiError.badRequest("Format d'image non supporté (jpg, png ou webp uniquement)"));
            return;
        }
        if (err) {
            next(err);
            return;
        }
        next();
    });
}
function uploadIdentityDocument(req, res, next) {
    documentUpload.single('document')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            next(ApiError_1.ApiError.badRequest('Fichier trop volumineux (8 Mo maximum)'));
            return;
        }
        if (err instanceof Error && err.message === 'UNSUPPORTED_TYPE') {
            next(ApiError_1.ApiError.badRequest('Format non supporté (jpg, png, webp ou pdf uniquement)'));
            return;
        }
        if (err) {
            next(err);
            return;
        }
        next();
    });
}
//# sourceMappingURL=upload.middleware.js.map