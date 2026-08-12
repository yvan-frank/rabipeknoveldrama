"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCoverHandler = uploadCoverHandler;
exports.uploadDocumentHandler = uploadDocumentHandler;
const ApiError_1 = require("../../utils/ApiError");
const env_1 = require("../../config/env");
async function uploadCoverHandler(req, res) {
    if (!req.file) {
        throw ApiError_1.ApiError.badRequest('Aucune image reçue');
    }
    const url = `${env_1.env.APP_URL}/uploads/covers/${req.file.filename}`;
    res.status(201).json({ success: true, data: { url } });
}
async function uploadDocumentHandler(req, res) {
    if (!req.file) {
        throw ApiError_1.ApiError.badRequest('Aucun document reçu');
    }
    const url = `${env_1.env.APP_URL}/uploads/documents/${req.file.filename}`;
    res.status(201).json({ success: true, data: { url } });
}
//# sourceMappingURL=uploads.controller.js.map