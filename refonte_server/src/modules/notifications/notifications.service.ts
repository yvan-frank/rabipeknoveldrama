import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
// Limite documentée par Expo pour un seul appel à /push/send.
const EXPO_PUSH_BATCH_SIZE = 100;

export async function registerPushToken(userId: number, token: string) {
  await prisma.pushToken.upsert({
    where: { token },
    create: { userId, token },
    // Le jeton peut appartenir à un autre compte si l'appareil a changé
    // d'utilisateur entre-temps (déconnexion/reconnexion sur le même
    // appareil) : on le réattribue plutôt que d'échouer sur l'unicité.
    update: { userId },
  });
}

export async function unregisterPushToken(userId: number, token: string) {
  await prisma.pushToken.deleteMany({ where: { userId, token } });
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function sendExpoPushBatch(messages: ExpoPushMessage[]) {
  if (messages.length === 0) return;
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!response.ok) {
      logger.warn({ status: response.status }, "Réponse non-OK de l'API Expo Push");
    }
  } catch (error) {
    logger.error({ err: error }, "Échec d'envoi d'un lot de notifications push Expo");
  }
}

// Fire-and-forget par conception : une notification manquée n'est jamais une
// raison de faire échouer l'action qui l'a déclenchée (ex. une réponse
// support envoyée avec succès ne doit pas devenir une erreur 500 juste parce
// que l'utilisateur a désinstallé l'app depuis).
export async function sendPushToUser(userId: number, title: string, body: string, data?: Record<string, unknown>) {
  const tokens = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
  if (tokens.length === 0) return;
  await sendExpoPushBatch(tokens.map((t) => ({ to: t.token, title, body, data })));
}

function todayDateOnlyUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Relance uniquement les utilisateurs déjà engagés dans une série (dernier
// check-in = hier) qui ne l'ont pas encore validée aujourd'hui — pas de
// relance froide vers quelqu'un qui n'a jamais fait de check-in, un message
// "ne perdez pas votre série" n'aurait aucun sens pour lui.
export async function sendCheckInReminders() {
  const today = todayDateOnlyUtc();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const candidates = await prisma.user.findMany({
    where: {
      pushTokens: { some: {} },
      checkIns: { some: { checkInDate: yesterday } },
      NOT: { checkIns: { some: { checkInDate: today } } },
    },
    select: { id: true },
  });

  const allMessages: ExpoPushMessage[] = [];
  for (const candidate of candidates) {
    const tokens = await prisma.pushToken.findMany({ where: { userId: candidate.id }, select: { token: true } });
    for (const t of tokens) {
      allMessages.push({
        to: t.token,
        title: 'Ne perdez pas votre série !',
        body: 'Faites votre check-in du jour pour continuer à cumuler vos bonus.',
        data: { type: 'checkin-reminder' },
      });
    }
  }

  for (let i = 0; i < allMessages.length; i += EXPO_PUSH_BATCH_SIZE) {
    await sendExpoPushBatch(allMessages.slice(i, i + EXPO_PUSH_BATCH_SIZE));
  }

  return { usersNotified: candidates.length };
}
