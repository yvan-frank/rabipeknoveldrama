import { apiClient } from './client';
import type { ApiEnvelope } from './types';

// Miroir de refonte_server/src/modules/users/users.service.ts (getUserDashboard).
export interface LibraryBookSummary {
  id: number;
  title: string;
  slug: string;
  cover: string | null;
  _count: { chapters: number };
}

export interface LibraryEntry {
  id: number;
  book: LibraryBookSummary;
  totalChapters: number;
  chapterRead: number | null;
  progressPercent: number;
  purchased: boolean;
  purchasedParts: string[];
  lastActivityAt: string;
}

export interface DashboardResponse {
  library: LibraryEntry[];
  counts: { cart: number; purchases: number; reads: number; likes: number; comments: number; shares: number };
}

// Réservé aux comptes lecteur (requireRole('user') côté serveur) — les
// auteurs/admins n'ont pas de "bibliothèque" au sens lecteur.
export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await apiClient.get<ApiEnvelope<DashboardResponse>>('/users/moi/tableau-de-bord');
  return response.data.data;
}

// Estimation continue de la progression globale d'un livre : le chapitre en
// cours compte pour sa fraction (progressPercent), les précédents pour 1 entier.
export function overallProgress(entry: LibraryEntry): number {
  if (!entry.totalChapters || entry.chapterRead == null) return 0;
  const completedChapters = Math.max(entry.chapterRead - 1, 0) + entry.progressPercent / 100;
  return Math.min(100, Math.round((completedChapters / entry.totalChapters) * 100));
}
