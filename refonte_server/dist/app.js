"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const node_path_1 = __importDefault(require("node:path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const cors_2 = require("./config/cors");
const logger_1 = require("./lib/logger");
const error_middleware_1 = require("./middlewares/error.middleware");
const routes_1 = require("./routes");
function createApp() {
    const app = (0, express_1.default)();
    // `crossOriginResourcePolicy` sinon Helmet bloque le chargement des images
    // uploadées depuis l'origine du frontend (différente de celle de l'API).
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use((0, cors_1.default)(cors_2.corsOptions));
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
    app.use('/uploads', express_1.default.static(node_path_1.default.join(process.cwd(), 'public', 'uploads')));
    app.get('/health', (_req, res) => {
        res.json({ success: true, status: 'ok' });
    });
    app.use('/api', routes_1.router);
    // Ordre volontaire : notFoundHandler puis errorHandler, tous deux APRÈS
    // le montage des routes.
    app.use(error_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map