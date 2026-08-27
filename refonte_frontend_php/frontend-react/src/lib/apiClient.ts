import axios from 'axios';

// Equivalent de refonte_rabi_frontend/src/lib/api-client.ts : les ilots React
// appellent l'API (refonte_server_php) directement depuis le navigateur,
// avec le cookie httpOnly de session (withCredentials).
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export function extractApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return fallback;
}

export interface SessionUser {
  id: number;
  email: string;
  role: 'user' | 'author' | 'admin';
  // Présent uniquement pour role === 'author' — requis par POST /books
  // (BooksSchema::create exige authorId dans le corps de la requête, pas
  // déduit automatiquement de la session côté API).
  authorId?: number;
}

// GET /auth/me renvoie {success, data:{user:{...}}} — imbriqué sous "user"
// (cf. refonte_server_php AuthController::me), pas directement l'objet.
// Helper partagé pour que ce détail ne soit pas re-décodé à la main (et mal)
// dans chaque îlot qui a besoin de savoir qui est connecté.
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const res = await apiClient.get('/auth/me');
    return res.data?.data?.user ?? null;
  } catch {
    return null;
  }
}
