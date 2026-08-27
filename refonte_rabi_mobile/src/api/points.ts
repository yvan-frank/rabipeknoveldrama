import { apiClient } from './client';
import type { ApiEnvelope } from './types';

export interface PointsBalance {
  balance: number;
  bonusCount: number;
}

export interface RewardedAdCreditResult {
  balance: number;
  earned: number;
  watchedToday: number;
}

export interface RewardedAdStatus {
  watchedToday: number;
  dailyCap: number;
}

export interface ChapterUnlockResult {
  chapterId: number;
  pointsSpent: number;
  balance: number;
}

// Étude de faisabilité "points pour lire un chapitre" -> mécanisme implémenté
// côté serveur (cf. PointsService::unlockChapterWithPoints,
// ChaptersService::assertChapterAccess) : déblocage définitif d'UN chapitre
// premium, complémentaire à l'achat en argent (grain livre/partie), pas un
// substitut. Le coût est réglable côté admin (platform_settings), jamais
// codé en dur ici.
export async function getChapterUnlockCost(): Promise<number> {
  const response = await apiClient.get<ApiEnvelope<{ cost: number }>>('/points/chapter-unlock-cost');
  return response.data.data.cost;
}

export async function unlockChapterWithPoints(chapterId: number): Promise<ChapterUnlockResult> {
  const response = await apiClient.post<ApiEnvelope<ChapterUnlockResult>>(`/points/chapters/${chapterId}/unlock`);
  return response.data.data;
}

export async function getPointsBalance(): Promise<PointsBalance> {
  const response = await apiClient.get<ApiEnvelope<PointsBalance>>('/points/balance');
  return response.data.data;
}

export async function getRewardedAdStatus(): Promise<RewardedAdStatus> {
  const response = await apiClient.get<ApiEnvelope<RewardedAdStatus>>('/points/earn/rewarded-ad');
  return response.data.data;
}

// Appelé une fois la pub récompensée par Google confirmée côté client
// (isEarnedReward) — le montant crédité est décidé côté serveur, jamais ici.
export async function creditRewardedAdPoints(): Promise<RewardedAdCreditResult> {
  const response = await apiClient.post<ApiEnvelope<RewardedAdCreditResult>>('/points/earn/rewarded-ad');
  return response.data.data;
}

export interface CheckInStatus {
  streakDay: number;
  checkedInToday: boolean;
  pointsSchedule: number[];
}

export interface CheckInResult {
  streakDay: number;
  earned: number;
  balance: number;
}

export async function getCheckInStatus(): Promise<CheckInStatus> {
  const response = await apiClient.get<ApiEnvelope<CheckInStatus>>('/points/checkin');
  return response.data.data;
}

export async function performCheckIn(): Promise<CheckInResult> {
  const response = await apiClient.post<ApiEnvelope<CheckInResult>>('/points/checkin');
  return response.data.data;
}

export type ArticleId = 'article-1' | 'article-2' | 'article-3';

export interface ArticleInfo {
  id: ArticleId;
  url: string;
  read: boolean;
}

export interface ArticlesStatus {
  articles: ArticleInfo[];
}

export interface ArticleReadResult {
  readCount: number;
  earned: number;
  balance?: number;
}

export async function getArticlesStatus(): Promise<ArticlesStatus> {
  const response = await apiClient.get<ApiEnvelope<ArticlesStatus>>('/points/articles');
  return response.data.data;
}

export async function markArticleRead(articleId: ArticleId): Promise<ArticleReadResult> {
  const response = await apiClient.post<ApiEnvelope<ArticleReadResult>>(`/points/articles/${articleId}/read`);
  return response.data.data;
}

export interface ReadingMilestone {
  minutes: number;
  points: number;
  earned: boolean;
}

export interface ReadingTimeStatus {
  secondsToday: number;
  milestones: ReadingMilestone[];
}

export interface ReadingTimeResult extends ReadingTimeStatus {
  earned: number;
  balance?: number;
}

export async function getReadingTimeStatus(): Promise<ReadingTimeStatus> {
  const response = await apiClient.get<ApiEnvelope<ReadingTimeStatus>>('/points/reading-time');
  return response.data.data;
}

// Appelé par petits incréments (~20s) pendant la lecture active d'un
// chapitre (cf. chapter/[chapterId].tsx) — jamais un gros total d'un coup,
// le serveur borne de toute façon chaque incrément (cf. points.service.ts).
export async function addReadingTime(seconds: number): Promise<ReadingTimeResult> {
  const response = await apiClient.post<ApiEnvelope<ReadingTimeResult>>('/points/reading-time', { seconds });
  return response.data.data;
}
