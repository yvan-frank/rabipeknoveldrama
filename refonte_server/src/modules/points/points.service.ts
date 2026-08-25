import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export const POINTS_REASON_REWARDED_AD = 'rewarded_ad';
export const POINTS_REASON_DAILY_CHECKIN = 'daily_checkin';
export const POINTS_REASON_ARTICLES_TASK = 'articles_task';
export const POINTS_REASON_READING_15MIN = 'reading_time_15min';
export const POINTS_REASON_READING_30MIN = 'reading_time_30min';

// Paliers quotidiens de temps de lecture (cf. capture de référence : "Lire
// pendant 15/30 minute"). Le cumul continue de monter après 30 min mais ne
// déclenche plus aucun crédit — seuls ces deux paliers existent.
const READING_MILESTONES = [
  { minutes: 15, seconds: 15 * 60, points: 5, reason: POINTS_REASON_READING_15MIN, field: 'milestone15Credited' as const },
  { minutes: 30, seconds: 30 * 60, points: 10, reason: POINTS_REASON_READING_30MIN, field: 'milestone30Credited' as const },
];

// Un incrément client ne peut jamais dépasser cette durée : borne le dégât
// possible d'un client modifié qui enverrait une valeur fantaisiste (le
// lecteur mobile rapporte par tranches de ~20s, cf. chapter/[chapterId].tsx).
const MAX_READING_INCREMENT_SECONDS = 120;

// Liste figée côté serveur (jamais fournie par le client) : la tâche "Lisez 3
// articles" pointe vers 3 vrais articles externes choisis par le produit,
// pas un flux dynamique — un id stable par article sert de clé pour
// ArticleRead et évite d'exposer/valider des URLs arbitraires.
const ARTICLE_LINKS = [
  {
    id: 'article-1',
    url: 'https://lequotidiendactu.com/entree-express/residence-permanente-au-canada-1-000-candidats-de-l-experience-canadienne',
  },
  {
    id: 'article-2',
    url: 'https://lequotidiendactu.com/immigration/presidentielle-2027-immigration-etudiants-etrangers-france',
  },
  {
    id: 'article-3',
    url: 'https://lequotidiendactu.com/se-preparer-et-vivre-en-france/payer-cvec-une-fois-en-france',
  },
] as const;

type ArticleId = (typeof ARTICLE_LINKS)[number]['id'];

// Récompense unique à la complétion des 3 (pas de crédit partiel par
// article) : cohérent avec le libellé "1 Bonus (x/3)" de la capture de
// référence, qui annonce une seule récompense pour la tâche entière.
const ARTICLES_TASK_POINTS = 15;

// Barème du cycle de 7 jours (index 0 = jour 1) : jour 1 démarre plus bas que
// les suivants pour inciter à revenir au-delà du premier jour.
const CHECKIN_POINTS_SCHEDULE = [15, 20, 20, 20, 20, 20, 20];

// Montant fixe décidé côté serveur (jamais fourni par le client) : le
// visionnage d'une pub récompensée par Google est déjà validé par le SDK
// (isEarnedReward), mais le nombre de points crédités doit rester hors de
// portée d'un client modifié.
const REWARDED_AD_POINTS = 5;

// Anti-abus minimal : un client (même modifié) ne peut pas rejouer l'appel de
// crédit plus vite que le temps de recharge réel d'une pub récompensée.
const REWARDED_AD_COOLDOWN_MS = 20_000;

// Plafond quotidien de pubs récompensées créditées (cf. capture de référence :
// "1 Bonus (0/20)") — protège aussi contre l'abus d'un client qui rejouerait
// l'appel en boucle en respectant juste le cooldown ci-dessus.
export const REWARDED_AD_DAILY_CAP = 20;

// Date-only en UTC, indépendante du fuseau du serveur : comparée uniquement à
// d'autres valeurs produites par la même fonction, donc cohérente avec elle-même.
function todayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function previousDate(date: Date): Date {
  return new Date(date.getTime() - 24 * 60 * 60 * 1000);
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function countRewardedAdsToday(userId: number): Promise<number> {
  return prisma.pointsTransaction.count({
    where: { userId, reason: POINTS_REASON_REWARDED_AD, createdAt: { gte: startOfDayUtc(new Date()) } },
  });
}

export async function getBalance(userId: number) {
  const [user, bonusCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } }),
    // Nombre de bonus réellement obtenus (une ligne de ledger = un crédit :
    // une pub, un check-in, la tâche articles) — pas dérivé du solde, qui ne
    // dit rien du nombre d'événements derrière (cf. carte "Mon portefeuille").
    prisma.pointsTransaction.count({ where: { userId } }),
  ]);
  if (!user) {
    throw ApiError.notFound('Utilisateur introuvable');
  }
  return { balance: user.pointsBalance, bonusCount };
}

export async function listTransactions(userId: number, limit: number) {
  return prisma.pointsTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getRewardedAdStatus(userId: number) {
  const watchedToday = await countRewardedAdsToday(userId);
  return { watchedToday, dailyCap: REWARDED_AD_DAILY_CAP };
}

export async function creditRewardedAd(userId: number) {
  const lastCredit = await prisma.pointsTransaction.findFirst({
    where: { userId, reason: POINTS_REASON_REWARDED_AD },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (lastCredit && Date.now() - lastCredit.createdAt.getTime() < REWARDED_AD_COOLDOWN_MS) {
    throw ApiError.tooManyRequests('Récompense déjà créditée récemment, réessayez dans quelques secondes');
  }

  const watchedToday = await countRewardedAdsToday(userId);
  if (watchedToday >= REWARDED_AD_DAILY_CAP) {
    throw ApiError.tooManyRequests('Limite quotidienne de pubs récompensées atteinte, revenez demain');
  }

  const [, user] = await prisma.$transaction([
    prisma.pointsTransaction.create({
      data: { userId, amount: REWARDED_AD_POINTS, reason: POINTS_REASON_REWARDED_AD },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: REWARDED_AD_POINTS } },
      select: { pointsBalance: true },
    }),
  ]);

  return { balance: user.pointsBalance, earned: REWARDED_AD_POINTS, watchedToday: watchedToday + 1 };
}

export async function getCheckInStatus(userId: number) {
  const today = todayDateOnly();
  const lastCheckIn = await prisma.checkIn.findFirst({
    where: { userId },
    orderBy: { checkInDate: 'desc' },
  });

  const checkedInToday = !!lastCheckIn && isSameDate(lastCheckIn.checkInDate, today);
  // La série ne reste valide que si le dernier check-in remonte à aujourd'hui
  // ou hier ; un jour manqué la remet à zéro (prochain check-in = jour 1).
  const streakStillValid =
    !!lastCheckIn && (checkedInToday || isSameDate(lastCheckIn.checkInDate, previousDate(today)));

  return {
    streakDay: streakStillValid ? lastCheckIn!.streakDay : 0,
    checkedInToday,
    pointsSchedule: CHECKIN_POINTS_SCHEDULE,
  };
}

export async function performCheckIn(userId: number) {
  const today = todayDateOnly();
  const lastCheckIn = await prisma.checkIn.findFirst({
    where: { userId },
    orderBy: { checkInDate: 'desc' },
  });

  if (lastCheckIn && isSameDate(lastCheckIn.checkInDate, today)) {
    throw ApiError.conflict("Check-in déjà effectué aujourd'hui");
  }

  const streakContinues = !!lastCheckIn && isSameDate(lastCheckIn.checkInDate, previousDate(today));
  const newStreakDay = streakContinues && lastCheckIn!.streakDay < 7 ? lastCheckIn!.streakDay + 1 : 1;
  const points = CHECKIN_POINTS_SCHEDULE[newStreakDay - 1]!;

  try {
    const [, , user] = await prisma.$transaction([
      prisma.checkIn.create({ data: { userId, checkInDate: today, streakDay: newStreakDay } }),
      prisma.pointsTransaction.create({
        data: { userId, amount: points, reason: POINTS_REASON_DAILY_CHECKIN },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { pointsBalance: { increment: points } },
        select: { pointsBalance: true },
      }),
    ]);

    return { streakDay: newStreakDay, earned: points, balance: user.pointsBalance };
  } catch (error) {
    // Course entre deux requêtes quasi simultanées : la contrainte unique
    // (userId, checkInDate) tranche, on la traduit en conflit métier normal.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw ApiError.conflict("Check-in déjà effectué aujourd'hui");
    }
    throw error;
  }
}

export async function getArticlesStatus(userId: number) {
  const reads = await prisma.articleRead.findMany({ where: { userId }, select: { articleId: true } });
  const readIds = new Set(reads.map((read) => read.articleId));

  return {
    articles: ARTICLE_LINKS.map((article) => ({ id: article.id, url: article.url, read: readIds.has(article.id) })),
  };
}

export async function markArticleRead(userId: number, articleId: ArticleId) {
  try {
    await prisma.articleRead.create({ data: { userId, articleId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Article déjà marqué lu (double ouverture) : pas une erreur, on
      // renvoie juste l'état courant sans re-créditer.
      const readCount = await prisma.articleRead.count({ where: { userId } });
      return { readCount, earned: 0, balance: undefined };
    }
    throw error;
  }

  const readCount = await prisma.articleRead.count({ where: { userId } });
  // Ne peut se produire qu'une seule fois par utilisateur : chaque articleId
  // ne peut être inséré qu'une fois (contrainte unique), donc le compte ne
  // peut atteindre ARTICLE_LINKS.length qu'à l'instant précis de ce dernier insert.
  const justCompleted = readCount === ARTICLE_LINKS.length;

  if (!justCompleted) {
    return { readCount, earned: 0, balance: undefined };
  }

  const [, user] = await prisma.$transaction([
    prisma.pointsTransaction.create({
      data: { userId, amount: ARTICLES_TASK_POINTS, reason: POINTS_REASON_ARTICLES_TASK },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: ARTICLES_TASK_POINTS } },
      select: { pointsBalance: true },
    }),
  ]);

  return { readCount, earned: ARTICLES_TASK_POINTS, balance: user.pointsBalance };
}

function readingMilestonesView(entry: { totalSeconds: number; milestone15Credited: boolean; milestone30Credited: boolean } | null) {
  return READING_MILESTONES.map((m) => ({
    minutes: m.minutes,
    points: m.points,
    earned: m.field === 'milestone15Credited' ? (entry?.milestone15Credited ?? false) : (entry?.milestone30Credited ?? false),
  }));
}

export async function getReadingTimeStatus(userId: number) {
  const today = todayDateOnly();
  const entry = await prisma.dailyReadingTime.findUnique({ where: { userId_date: { userId, date: today } } });
  return { secondsToday: entry?.totalSeconds ?? 0, milestones: readingMilestonesView(entry) };
}

export async function addReadingTime(userId: number, seconds: number) {
  const today = todayDateOnly();
  const clamped = Math.min(Math.max(Math.trunc(seconds), 0), MAX_READING_INCREMENT_SECONDS);

  const entry = await prisma.dailyReadingTime.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, totalSeconds: clamped },
    update: { totalSeconds: { increment: clamped } },
  });

  const newlyReached = READING_MILESTONES.filter(
    (m) => entry.totalSeconds >= m.seconds && !entry[m.field],
  );

  if (newlyReached.length === 0) {
    return { secondsToday: entry.totalSeconds, earned: 0, balance: undefined, milestones: readingMilestonesView(entry) };
  }

  const totalPoints = newlyReached.reduce((sum, m) => sum + m.points, 0);
  const milestoneFlags = Object.fromEntries(newlyReached.map((m) => [m.field, true]));

  const results = await prisma.$transaction([
    ...newlyReached.map((m) => prisma.pointsTransaction.create({ data: { userId, amount: m.points, reason: m.reason } })),
    prisma.dailyReadingTime.update({ where: { id: entry.id }, data: milestoneFlags }),
    prisma.user.update({ where: { id: userId }, data: { pointsBalance: { increment: totalPoints } }, select: { pointsBalance: true } }),
  ]);

  const updatedEntry = results[results.length - 2] as Awaited<ReturnType<typeof prisma.dailyReadingTime.update>>;
  const user = results[results.length - 1] as { pointsBalance: number };

  return {
    secondsToday: entry.totalSeconds,
    earned: totalPoints,
    balance: user.pointsBalance,
    milestones: readingMilestonesView(updatedEntry),
  };
}
