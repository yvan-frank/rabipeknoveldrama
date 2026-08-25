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
exports.listBookReviewsHandler = listBookReviewsHandler;
exports.upsertBookReviewHandler = upsertBookReviewHandler;
exports.replyToBookReviewHandler = replyToBookReviewHandler;
exports.listChapterCommentsHandler = listChapterCommentsHandler;
exports.createChapterCommentHandler = createChapterCommentHandler;
exports.deleteChapterCommentHandler = deleteChapterCommentHandler;
const commentsService = __importStar(require("./comments.service"));
async function listBookReviewsHandler(req, res) {
    const { bookId } = req.params;
    const reviews = await commentsService.listBookReviews(bookId);
    res.json({ success: true, data: reviews });
}
async function upsertBookReviewHandler(req, res) {
    const { bookId } = req.params;
    const review = await commentsService.upsertBookReview(bookId, req.user.id, req.body);
    res.status(201).json({ success: true, data: review });
}
async function replyToBookReviewHandler(req, res) {
    const { commentId } = req.params;
    const reply = await commentsService.replyToBookReview(commentId, req.body.content, req.user);
    res.json({ success: true, data: reply });
}
async function listChapterCommentsHandler(req, res) {
    const { chapterId } = req.params;
    const comments = await commentsService.listChapterComments(chapterId);
    res.json({ success: true, data: comments });
}
async function createChapterCommentHandler(req, res) {
    const { chapterId } = req.params;
    const comment = await commentsService.createChapterComment(chapterId, req.user.id, req.body);
    res.status(201).json({ success: true, data: comment });
}
async function deleteChapterCommentHandler(req, res) {
    const { commentId } = req.params;
    await commentsService.deleteChapterComment(commentId, req.user.id);
    res.json({ success: true, data: null });
}
//# sourceMappingURL=comments.controller.js.map