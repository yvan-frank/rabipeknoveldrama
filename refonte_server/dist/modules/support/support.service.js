"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyMessages = getMyMessages;
exports.getUnreadCountForUser = getUnreadCountForUser;
exports.sendMessageAsUser = sendMessageAsUser;
exports.listConversationsForAdmin = listConversationsForAdmin;
exports.getConversationForAdmin = getConversationForAdmin;
exports.sendMessageAsAdmin = sendMessageAsAdmin;
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
const notifications_service_1 = require("../notifications/notifications.service");
const MESSAGE_SELECT = {
    id: true,
    sender: true,
    content: true,
    createdAt: true,
};
// Un seul fil par utilisateur (cf. schema.prisma) : "la conversation" EST
// l'ensemble de ses SupportMessage, pas besoin d'une entité séparée.
async function getMyMessages(userId) {
    const messages = await prisma_1.prisma.supportMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: MESSAGE_SELECT,
    });
    // Ouvrir le fil vaut lecture des réponses du support reçues depuis.
    await prisma_1.prisma.supportMessage.updateMany({
        where: { userId, sender: 'admin', readByUser: false },
        data: { readByUser: true },
    });
    return messages;
}
async function getUnreadCountForUser(userId) {
    return prisma_1.prisma.supportMessage.count({ where: { userId, sender: 'admin', readByUser: false } });
}
async function sendMessageAsUser(userId, content) {
    return prisma_1.prisma.supportMessage.create({ data: { userId, sender: 'user', content }, select: MESSAGE_SELECT });
}
// -- Côté admin (cf. support.routes.ts, requireRole('admin')) ---------------
async function listConversationsForAdmin() {
    const users = await prisma_1.prisma.user.findMany({
        where: { supportMessages: { some: {} } },
        select: {
            id: true,
            name: true,
            email: true,
            supportMessages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { content: true, createdAt: true, sender: true },
            },
            _count: { select: { supportMessages: { where: { sender: 'user', readByAdmin: false } } } },
        },
    });
    return users
        .map((user) => ({
        userId: user.id,
        name: user.name,
        email: user.email,
        lastMessage: user.supportMessages[0] ?? null,
        unreadCount: user._count.supportMessages,
    }))
        .sort((a, b) => (b.lastMessage?.createdAt.getTime() ?? 0) - (a.lastMessage?.createdAt.getTime() ?? 0));
}
async function getConversationForAdmin(userId) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
    if (!user)
        throw ApiError_1.ApiError.notFound('Utilisateur introuvable');
    const messages = await prisma_1.prisma.supportMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: MESSAGE_SELECT,
    });
    await prisma_1.prisma.supportMessage.updateMany({
        where: { userId, sender: 'user', readByAdmin: false },
        data: { readByAdmin: true },
    });
    return { user, messages };
}
async function sendMessageAsAdmin(userId, content) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user)
        throw ApiError_1.ApiError.notFound('Utilisateur introuvable');
    const message = await prisma_1.prisma.supportMessage.create({ data: { userId, sender: 'admin', content }, select: MESSAGE_SELECT });
    // Best-effort : une notification manquée ne doit pas faire échouer l'envoi
    // du message lui-même (cf. sendPushToUser, fire-and-forget par conception).
    void (0, notifications_service_1.sendPushToUser)(userId, 'Réponse du support', content.slice(0, 120), { type: 'support-reply' }).catch(() => undefined);
    return message;
}
//# sourceMappingURL=support.service.js.map