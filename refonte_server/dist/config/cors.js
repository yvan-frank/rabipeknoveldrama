"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const env_1 = require("./env");
exports.corsOptions = {
    origin(origin, callback) {
        // Requêtes sans origin (curl, apps mobiles, healthchecks) autorisées.
        if (!origin || env_1.env.CORS_ORIGINS.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin non autorisée par CORS : ${origin}`));
    },
    credentials: true,
};
//# sourceMappingURL=cors.js.map