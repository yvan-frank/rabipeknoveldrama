import { apiClient } from './client';
import type { ApiEnvelope } from './types';

// La génération d'une édition EPUB reste une action auteur (POST/GET
// /books/:id/epub-editions sont restreints à requireRole('author','admin')
// côté serveur) — ce endpoint lecteur ne fait que consulter l'édition prête
// et à jour la plus récente, sans droit de déclencher une génération.
export interface CurrentEpubEdition {
  id: number;
  version: number;
  fileSizeBytes: number | null;
  generatedAt: string | null;
}

export async function fetchCurrentEpubEdition(bookId: number): Promise<CurrentEpubEdition | null> {
  const response = await apiClient.get<ApiEnvelope<CurrentEpubEdition | null>>(`/books/${bookId}/epub-editions/current`);
  return response.data.data;
}
