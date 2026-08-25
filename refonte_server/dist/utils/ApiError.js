"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
    }
    static badRequest(message = 'Requête invalide', details) {
        return new ApiError(400, message, details);
    }
    static unauthorized(message = 'Non authentifié') {
        return new ApiError(401, message);
    }
    static forbidden(message = 'Accès refusé') {
        return new ApiError(403, message);
    }
    static notFound(message = 'Ressource introuvable') {
        return new ApiError(404, message);
    }
    static conflict(message = 'Conflit avec une ressource existante') {
        return new ApiError(409, message);
    }
    static tooManyRequests(message = 'Trop de requêtes, réessayez plus tard') {
        return new ApiError(429, message);
    }
    static internal(message = 'Erreur interne du serveur') {
        return new ApiError(500, message);
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=ApiError.js.map