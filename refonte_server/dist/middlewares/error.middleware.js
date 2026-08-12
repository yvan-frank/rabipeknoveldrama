"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
const logger_1 = require("../lib/logger");
const env_1 = require("../config/env");
// IMPORTANT : ce middleware doit être enregistré en DERNIER, après toutes les
// routes (Express n'invoque un error-middleware que pour les erreurs passées
// via next(err) et seulement s'il est déclaré après le code qui peut échouer —
// c'est le bug qu'on corrige par rapport à l'ancien app.js).
function errorHandler(err, req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation échouée',
            errors: err.flatten().fieldErrors,
        });
        return;
    }
    if (err instanceof ApiError_1.ApiError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.details ? { errors: err.details } : {}),
        });
        return;
    }
    logger_1.logger.error({ err, path: req.path, method: req.method }, 'Erreur non gérée');
    res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        ...(env_1.isProduction ? {} : { stack: err?.stack }),
    });
}
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    });
}
//# sourceMappingURL=error.middleware.js.map