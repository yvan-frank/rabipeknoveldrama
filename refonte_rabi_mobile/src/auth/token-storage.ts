import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from '../api/types';

// expo-secure-store chiffre via Keychain (iOS) / Keystore (Android) — jamais
// AsyncStorage en clair pour un access/refresh token (cf. plan mobile,
// section sécurité locale).
const ACCESS_TOKEN_KEY = 'rabipek_access_token';
const REFRESH_TOKEN_KEY = 'rabipek_refresh_token';
// Jeton invité (cf. AuthMiddleware::guestOrAuth côté serveur, header
// X-Guest-Token) : un simple JWT longue durée sans refresh token associé,
// utilisé en Bearer tant qu'aucun compte réel n'est connecté.
const GUEST_TOKEN_KEY = 'rabipek_guest_token';

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function saveGuestToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(GUEST_TOKEN_KEY, token);
}

export async function getGuestToken(): Promise<string | null> {
  return SecureStore.getItemAsync(GUEST_TOKEN_KEY);
}

export async function clearGuestToken(): Promise<void> {
  await SecureStore.deleteItemAsync(GUEST_TOKEN_KEY);
}
