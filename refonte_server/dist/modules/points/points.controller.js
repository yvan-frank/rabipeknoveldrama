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
exports.getBalanceHandler = getBalanceHandler;
exports.listTransactionsHandler = listTransactionsHandler;
exports.creditRewardedAdHandler = creditRewardedAdHandler;
exports.getRewardedAdStatusHandler = getRewardedAdStatusHandler;
exports.getCheckInStatusHandler = getCheckInStatusHandler;
exports.performCheckInHandler = performCheckInHandler;
exports.getArticlesStatusHandler = getArticlesStatusHandler;
exports.markArticleReadHandler = markArticleReadHandler;
exports.getReadingTimeStatusHandler = getReadingTimeStatusHandler;
exports.addReadingTimeHandler = addReadingTimeHandler;
const pointsService = __importStar(require("./points.service"));
async function getBalanceHandler(req, res) {
    const result = await pointsService.getBalance(req.user.id);
    res.json({ success: true, data: result });
}
async function listTransactionsHandler(req, res) {
    const { limit } = req.query;
    const result = await pointsService.listTransactions(req.user.id, limit);
    res.json({ success: true, data: result });
}
async function creditRewardedAdHandler(req, res) {
    const result = await pointsService.creditRewardedAd(req.user.id);
    res.json({ success: true, data: result });
}
async function getRewardedAdStatusHandler(req, res) {
    const result = await pointsService.getRewardedAdStatus(req.user.id);
    res.json({ success: true, data: result });
}
async function getCheckInStatusHandler(req, res) {
    const result = await pointsService.getCheckInStatus(req.user.id);
    res.json({ success: true, data: result });
}
async function performCheckInHandler(req, res) {
    const result = await pointsService.performCheckIn(req.user.id);
    res.json({ success: true, data: result });
}
async function getArticlesStatusHandler(req, res) {
    const result = await pointsService.getArticlesStatus(req.user.id);
    res.json({ success: true, data: result });
}
async function markArticleReadHandler(req, res) {
    const { articleId } = req.params;
    const result = await pointsService.markArticleRead(req.user.id, articleId);
    res.json({ success: true, data: result });
}
async function getReadingTimeStatusHandler(req, res) {
    const result = await pointsService.getReadingTimeStatus(req.user.id);
    res.json({ success: true, data: result });
}
async function addReadingTimeHandler(req, res) {
    const { seconds } = req.body;
    const result = await pointsService.addReadingTime(req.user.id, seconds);
    res.json({ success: true, data: result });
}
//# sourceMappingURL=points.controller.js.map