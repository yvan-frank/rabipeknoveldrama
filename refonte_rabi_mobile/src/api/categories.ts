import { apiClient } from './client';
import type { ApiEnvelope } from './types';
import type { CategorySummary } from './books';

export async function fetchCategories(): Promise<CategorySummary[]> {
  const response = await apiClient.get<ApiEnvelope<CategorySummary[]>>('/categories');
  return response.data.data;
}
