import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { sendPushToUser } from '../notifications/notifications.service';

const MESSAGE_SELECT = {
  id: true,
  sender: true,
  content: true,
  createdAt: true,
} as const;

// Un seul fil par utilisateur (cf. schema.prisma) : "la conversation" EST
// l'ensemble de ses SupportMessage, pas besoin d'une entité séparée.
export async function getMyMessages(userId: number) {
  const messages = await prisma.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: MESSAGE_SELECT,
  });
  // Ouvrir le fil vaut lecture des réponses du support reçues depuis.
  await prisma.supportMessage.updateMany({
    where: { userId, sender: 'admin', readByUser: false },
    data: { readByUser: true },
  });
  return messages;
}

export async function getUnreadCountForUser(userId: number) {
  return prisma.supportMessage.count({ where: { userId, sender: 'admin', readByUser: false } });
}

export async function sendMessageAsUser(userId: number, content: string) {
  return prisma.supportMessage.create({ data: { userId, sender: 'user', content }, select: MESSAGE_SELECT });
}

// -- Côté admin (cf. support.routes.ts, requireRole('admin')) ---------------

export async function listConversationsForAdmin() {
  const users = await prisma.user.findMany({
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

export async function getConversationForAdmin(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
  if (!user) throw ApiError.notFound('Utilisateur introuvable');

  const messages = await prisma.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: MESSAGE_SELECT,
  });

  await prisma.supportMessage.updateMany({
    where: { userId, sender: 'user', readByAdmin: false },
    data: { readByAdmin: true },
  });

  return { user, messages };
}

export async function sendMessageAsAdmin(userId: number, content: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw ApiError.notFound('Utilisateur introuvable');

  const message = await prisma.supportMessage.create({ data: { userId, sender: 'admin', content }, select: MESSAGE_SELECT });

  // Best-effort : une notification manquée ne doit pas faire échouer l'envoi
  // du message lui-même (cf. sendPushToUser, fire-and-forget par conception).
  void sendPushToUser(userId, 'Réponse du support', content.slice(0, 120), { type: 'support-reply' }).catch(() => undefined);

  return message;
}
