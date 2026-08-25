"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REWARDED_AD_DAILY_CAP = exports.POINTS_REASON_READING_30MIN = exports.POINTS_REASON_READING_15MIN = exports.POINTS_REASON_ARTICLES_TASK = exports.POINTS_REASON_DAILY_CHECKIN = exports.POINTS_REASON_REWARDED_AD = void 0;
exports.getBalance = getBalance;
exports.listTransactions = listTransactions;
exports.getRewardedAdStatus = getRewardedAdStatus;
exports.creditRewardedAd = creditRewardedAd;
exports.getCheckInStatus = getCheckInStatus;
exports.performCheckIn = performCheckIn;
exports.getArticlesStatus = getArticlesStatus;
exports.markArticleRead = markArticleRead;
exports.getReadingTimeStatus = getReadingTimeStatus;
exports.addReadingTime = addReadingTime;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
exports.POINTS_REASON_REWARDED_AD = 'rewarded_ad';
exports.POINTS_REASON_DAILY_CHECKIN = 'daily_checkin';
exports.POINTS_REASON_ARTICLES_TASK = 'articles_task';
exports.POINTS_REASON_READING_15MIN = 'reading_time_15min';
exports.POINTS_REASON_READING_30MIN = 'reading_time_30min';
// Paliers quotidiens de temps de lecture (cf. capture de référence : "Lire
// pendant 15/30 minute"). Le cumul continue de monter après 30 min mais ne
// déclenche plus aucun crédit — seuls ces deux paliers existent.
const READING_MILESTONES = [
    { minutes: 15, seconds: 15 * 60, points: 5, reason: exports.POINTS_REASON_READING_15MIN, field: 'milestone15Credited' },
    { minutes: 30, seconds: 30 * 60, points: 10, reason: exports.POINTS_REASON_READING_30MIN, field: 'milestone30Credited' },
];
// Un incrément client ne peut jamais dépasser cette durée : borne le dégât
// possible d'un client modifié qui enverrait une valeur fantaisiste (le
// lecteur mobile rapporte par tranches de ~20s, cf. chapter/[chapterId].tsx).
const MAX_READING_INCREMENT_SECONDS = 120;
// Paramètres UTM communs aux 3 liens (cf. ARTICLE_LINKS) : permet de repérer
// dans les statistiques du site partenaire le trafic généré par cette tâche
// bonus, distinct des autres sources (réseaux sociaux, recherche, etc.).
const ARTICLE_UTM_PARAMS = 'utm_source=rabipek_app&utm_medium=bonus_task&utm_campaign=lisez_3_articles';
// Liste figée côté serveur (jamais fournie par le client) : la tâche "Lisez 3
// articles" pointe vers 3 vrais articles externes choisis par le produit,
// pas un flux dynamique — un id stable par article sert de clé pour
// ArticleRead et évite d'exposer/valider des URLs arbitraires.
const ARTICLE_LINKS = [
    {
        id: 'article-1',
        url: `https://lequotidiendactu.com/entree-express/residence-permanente-au-canada-1-000-candidats-de-l-experience-canadienne?${ARTICLE_UTM_PARAMS}`,
    },
    {
        id: 'article-2',
        url: `https://lequotidiendactu.com/immigration/presidentielle-2027-immigration-etudiants-etrangers-france?${ARTICLE_UTM_PARAMS}`,
    },
    {
        id: 'article-3',
        url: `https://lequotidiendactu.com/se-preparer-et-vivre-en-france/payer-cvec-une-fois-en-france?${ARTICLE_UTM_PARAMS}`,
    },
];
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
exports.REWARDED_AD_DAILY_CAP = 20;
// Date-only en UTC, indépendante du fuseau du serveur : comparée uniquement à
// d'autres valeurs produites par la même fonction, donc cohérente avec elle-même.
function todayDateOnly() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
function previousDate(date) {
    return new Date(date.getTime() - 24 * 60 * 60 * 1000);
}
function isSameDate(a, b) {
    return a.getTime() === b.getTime();
}
function startOfDayUtc(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
async function countRewardedAdsToday(userId) {
    return prisma_1.prisma.pointsTransaction.count({
        where: { userId, reason: exports.POINTS_REASON_REWARDED_AD, createdAt: { gte: startOfDayUtc(new Date()) } },
    });
}
async function getBalance(userId) {
    const [user, bonusCount] = await Promise.all([
        prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } }),
        // Nombre de bonus réellement obtenus (une ligne de ledger = un crédit :
        // une pub, un check-in, la tâche articles) — pas dérivé du solde, qui ne
        // dit rien du nombre d'événements derrière (cf. carte "Mon portefeuille").
        prisma_1.prisma.pointsTransaction.count({ where: { userId } }),
    ]);
    if (!user) {
        throw ApiError_1.ApiError.notFound('Utilisateur introuvable');
    }
    return { balance: user.pointsBalance, bonusCount };
}
async function listTransactions(userId, limit) {
    return prisma_1.prisma.pointsTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}
async function getRewardedAdStatus(userId) {
    const watchedToday = await countRewardedAdsToday(userId);
    return { watchedToday, dailyCap: exports.REWARDED_AD_DAILY_CAP };
}
async function creditRewardedAd(userId) {
    const lastCredit = await prisma_1.prisma.pointsTransaction.findFirst({
        where: { userId, reason: exports.POINTS_REASON_REWARDED_AD },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
    });
    if (lastCredit && Date.now() - lastCredit.createdAt.getTime() < REWARDED_AD_COOLDOWN_MS) {
        throw ApiError_1.ApiError.tooManyRequests('Récompense déjà créditée récemment, réessayez dans quelques secondes');
    }
    const watchedToday = await countRewardedAdsToday(userId);
    if (watchedToday >= exports.REWARDED_AD_DAILY_CAP) {
        throw ApiError_1.ApiError.tooManyRequests('Limite quotidienne de pubs récompensées atteinte, revenez demain');
    }
    const [, user] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.pointsTransaction.create({
            data: { userId, amount: REWARDED_AD_POINTS, reason: exports.POINTS_REASON_REWARDED_AD },
        }),
        prisma_1.prisma.user.update({
            where: { id: userId },
            data: { pointsBalance: { increment: REWARDED_AD_POINTS } },
            select: { pointsBalance: true },
        }),
    ]);
    return { balance: user.pointsBalance, earned: REWARDED_AD_POINTS, watchedToday: watchedToday + 1 };
}
async function getCheckInStatus(userId) {
    const today = todayDateOnly();
    const lastCheckIn = await prisma_1.prisma.checkIn.findFirst({
        where: { userId },
        orderBy: { checkInDate: 'desc' },
    });
    const checkedInToday = !!lastCheckIn && isSameDate(lastCheckIn.checkInDate, today);
    // La série ne reste valide que si le dernier check-in remonte à aujourd'hui
    // ou hier ; un jour manqué la remet à zéro (prochain check-in = jour 1).
    const streakStillValid = !!lastCheckIn && (checkedInToday || isSameDate(lastCheckIn.checkInDate, previousDate(today)));
    return {
        streakDay: streakStillValid ? lastCheckIn.streakDay : 0,
        checkedInToday,
        pointsSchedule: CHECKIN_POINTS_SCHEDULE,
    };
}
async function performCheckIn(userId) {
    const today = todayDateOnly();
    const lastCheckIn = await prisma_1.prisma.checkIn.findFirst({
        where: { userId },
        orderBy: { checkInDate: 'desc' },
    });
    if (lastCheckIn && isSameDate(lastCheckIn.checkInDate, today)) {
        throw ApiError_1.ApiError.conflict("Check-in déjà effectué aujourd'hui");
    }
    const streakContinues = !!lastCheckIn && isSameDate(lastCheckIn.checkInDate, previousDate(today));
    const newStreakDay = streakContinues && lastCheckIn.streakDay < 7 ? lastCheckIn.streakDay + 1 : 1;
    const points = CHECKIN_POINTS_SCHEDULE[newStreakDay - 1];
    try {
        const [, , user] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.checkIn.create({ data: { userId, checkInDate: today, streakDay: newStreakDay } }),
            prisma_1.prisma.pointsTransaction.create({
                data: { userId, amount: points, reason: exports.POINTS_REASON_DAILY_CHECKIN },
            }),
            prisma_1.prisma.user.update({
                where: { id: userId },
                data: { pointsBalance: { increment: points } },
                select: { pointsBalance: true },
            }),
        ]);
        return { streakDay: newStreakDay, earned: points, balance: user.pointsBalance };
    }
    catch (error) {
        // Course entre deux requêtes quasi simultanées : la contrainte unique
        // (userId, checkInDate) tranche, on la traduit en conflit métier normal.
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw ApiError_1.ApiError.conflict("Check-in déjà effectué aujourd'hui");
        }
        throw error;
    }
}
async function getArticlesStatus(userId) {
    const reads = await prisma_1.prisma.articleRead.findMany({ where: { userId }, select: { articleId: true } });
    const readIds = new Set(reads.map((read) => read.articleId));
    return {
        articles: ARTICLE_LINKS.map((article) => ({ id: article.id, url: article.url, read: readIds.has(article.id) })),
    };
}
async function markArticleRead(userId, articleId) {
    try {
        await prisma_1.prisma.articleRead.create({ data: { userId, articleId } });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // Article déjà marqué lu (double ouverture) : pas une erreur, on
            // renvoie juste l'état courant sans re-créditer.
            const readCount = await prisma_1.prisma.articleRead.count({ where: { userId } });
            return { readCount, earned: 0, balance: undefined };
        }
        throw error;
    }
    const readCount = await prisma_1.prisma.articleRead.count({ where: { userId } });
    // Ne peut se produire qu'une seule fois par utilisateur : chaque articleId
    // ne peut être inséré qu'une fois (contrainte unique), donc le compte ne
    // peut atteindre ARTICLE_LINKS.length qu'à l'instant précis de ce dernier insert.
    const justCompleted = readCount === ARTICLE_LINKS.length;
    if (!justCompleted) {
        return { readCount, earned: 0, balance: undefined };
    }
    const [, user] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.pointsTransaction.create({
            data: { userId, amount: ARTICLES_TASK_POINTS, reason: exports.POINTS_REASON_ARTICLES_TASK },
        }),
        prisma_1.prisma.user.update({
            where: { id: userId },
            data: { pointsBalance: { increment: ARTICLES_TASK_POINTS } },
            select: { pointsBalance: true },
        }),
    ]);
    return { readCount, earned: ARTICLES_TASK_POINTS, balance: user.pointsBalance };
}
function readingMilestonesView(entry) {
    return READING_MILESTONES.map((m) => ({
        minutes: m.minutes,
        points: m.points,
        earned: m.field === 'milestone15Credited' ? (entry?.milestone15Credited ?? false) : (entry?.milestone30Credited ?? false),
    }));
}
async function getReadingTimeStatus(userId) {
    const today = todayDateOnly();
    const entry = await prisma_1.prisma.dailyReadingTime.findUnique({ where: { userId_date: { userId, date: today } } });
    return { secondsToday: entry?.totalSeconds ?? 0, milestones: readingMilestonesView(entry) };
}
async function addReadingTime(userId, seconds) {
    const today = todayDateOnly();
    const clamped = Math.min(Math.max(Math.trunc(seconds), 0), MAX_READING_INCREMENT_SECONDS);
    const entry = await prisma_1.prisma.dailyReadingTime.upsert({
        where: { userId_date: { userId, date: today } },
        create: { userId, date: today, totalSeconds: clamped },
        update: { totalSeconds: { increment: clamped } },
    });
    const newlyReached = READING_MILESTONES.filter((m) => entry.totalSeconds >= m.seconds && !entry[m.field]);
    if (newlyReached.length === 0) {
        return { secondsToday: entry.totalSeconds, earned: 0, balance: undefined, milestones: readingMilestonesView(entry) };
    }
    const totalPoints = newlyReached.reduce((sum, m) => sum + m.points, 0);
    const milestoneFlags = Object.fromEntries(newlyReached.map((m) => [m.field, true]));
    const results = await prisma_1.prisma.$transaction([
        ...newlyReached.map((m) => prisma_1.prisma.pointsTransaction.create({ data: { userId, amount: m.points, reason: m.reason } })),
        prisma_1.prisma.dailyReadingTime.update({ where: { id: entry.id }, data: milestoneFlags }),
        prisma_1.prisma.user.update({ where: { id: userId }, data: { pointsBalance: { increment: totalPoints } }, select: { pointsBalance: true } }),
    ]);
    const updatedEntry = results[results.length - 2];
    const user = results[results.length - 1];
    return {
        secondsToday: entry.totalSeconds,
        earned: totalPoints,
        balance: user.pointsBalance,
        milestones: readingMilestonesView(updatedEntry),
    };
}
//# sourceMappingURL=points.service.js.map