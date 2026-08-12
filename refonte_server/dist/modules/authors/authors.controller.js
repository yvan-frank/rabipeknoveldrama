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
exports.getMyKycHandler = getMyKycHandler;
exports.submitKycHandler = submitKycHandler;
exports.listAuthorsForKycReviewHandler = listAuthorsForKycReviewHandler;
exports.setAuthorKycVerificationHandler = setAuthorKycVerificationHandler;
exports.getAuthorKycBypassPolicyHandler = getAuthorKycBypassPolicyHandler;
exports.setAuthorKycBypassPolicyHandler = setAuthorKycBypassPolicyHandler;
const authorsService = __importStar(require("./authors.service"));
async function getMyKycHandler(req, res) {
    const result = await authorsService.getMyKyc(req.user.authorId);
    res.json({ success: true, data: result });
}
async function submitKycHandler(req, res) {
    const extension = await authorsService.submitKyc(req.user.authorId, req.body);
    res.json({ success: true, data: extension });
}
async function listAuthorsForKycReviewHandler(_req, res) {
    const authors = await authorsService.listAuthorsForKycReview();
    res.json({ success: true, data: authors });
}
async function setAuthorKycVerificationHandler(req, res) {
    const { authorId } = req.params;
    const { verified } = req.body;
    const extension = await authorsService.setAuthorKycVerification(authorId, verified);
    res.json({ success: true, data: extension });
}
async function getAuthorKycBypassPolicyHandler(_req, res) {
    const policy = await authorsService.getAuthorKycBypassPolicy();
    res.json({ success: true, data: policy });
}
async function setAuthorKycBypassPolicyHandler(req, res) {
    const { enabled } = req.body;
    const policy = await authorsService.setAuthorKycBypassPolicy(enabled);
    res.json({ success: true, data: policy });
}
//# sourceMappingURL=authors.controller.js.map