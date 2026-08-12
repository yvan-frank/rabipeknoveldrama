"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
// Évite d'avoir un try/catch dans chaque controller : toute rejection
// de promesse est transmise à `next()` et attrapée par errorHandler.
const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=asyncHandler.js.map