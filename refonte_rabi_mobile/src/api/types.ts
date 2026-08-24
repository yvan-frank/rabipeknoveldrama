// Miroir de refonte_server/src/modules/auth/auth.types.ts — à terme, à
// extraire dans un package partagé avec le web plutôt que dupliqué ici
// (cf. plan mobile, section architecture cible).
export type UserRole = 'user' | 'author' | 'admin';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  authorId?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}
