import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { env } from '../config/env';

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID manquant — connexion Google indisponible sur ce build.');
  }
  // webClientId (Web OAuth client, cf. .env.local) sert aussi d'audience
  // côté serveur pour vérifier le idToken — cf. AuthService::loginWithGoogle.
  GoogleSignin.configure({ webClientId: env.GOOGLE_CLIENT_ID });
  configured = true;
}

/** Lance le flux natif Google et renvoie le idToken, ou null si l'utilisateur a annulé. */
export async function signInWithGoogle(): Promise<string | null> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) return null;
  if (!response.data.idToken) {
    throw new Error("Google n'a pas renvoyé de jeton d'identité.");
  }
  return response.data.idToken;
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  return isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED;
}
