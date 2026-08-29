import { create } from 'zustand';
import { googleLoginRequest, loginRequest, logoutRequest, registerRequest, type LoginPayload, type RegisterPayload } from '../api/auth';
import { apiClient, setOnAuthExpired } from '../api/client';
import type { ApiEnvelope, AuthResponse, AuthUser } from '../api/types';
import { signInWithGoogle } from './google-signin';
import { clearGuestToken, clearTokens, getRefreshToken, loadTokens, saveTokens } from './token-storage';

type AuthStatus = 'bootstrapping' | 'guest' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  // false = l'utilisateur a annulé le sélecteur de compte Google (pas une erreur).
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'bootstrapping',
  user: null,

  // Appelé une fois au démarrage de l'app (cf. app/_layout.tsx). L'access
  // token stocké a très probablement expiré (durée de vie 15 min) entre deux
  // ouvertures de l'app : on échange donc directement le refresh token contre
  // une paire fraîche plutôt que de tenter un appel qui échouerait en 401.
  bootstrap: async () => {
    const tokens = await loadTokens();
    if (!tokens) {
      set({ status: 'guest', user: null });
      return;
    }

    try {
      const response = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });
      const { user, accessToken, refreshToken } = response.data.data;
      await saveTokens({ accessToken, refreshToken });
      set({ status: 'authenticated', user });
    } catch {
      await clearTokens();
      set({ status: 'guest', user: null });
    }
  },

  login: async (payload) => {
    const { user, accessToken, refreshToken } = await loginRequest(payload);
    await saveTokens({ accessToken, refreshToken });
    await clearGuestToken();
    set({ status: 'authenticated', user });
  },

  register: async (payload) => {
    // Le jeton invité éventuellement attaché par apiClient est lu côté
    // serveur pour convertir ce compte invité en compte réel (mêmes points) —
    // cf. AuthService::register($input, $guestUserId). Une fois l'inscription
    // faite, ce jeton est caduc : on le purge pour ne plus l'envoyer.
    const { user, accessToken, refreshToken } = await registerRequest(payload);
    await saveTokens({ accessToken, refreshToken });
    await clearGuestToken();
    set({ status: 'authenticated', user });
  },

  loginWithGoogle: async () => {
    const idToken = await signInWithGoogle();
    if (idToken === null) return false; // sélecteur de compte annulé par l'utilisateur

    // Même logique de fusion du compte invité que register() : le jeton
    // invité éventuel est attaché par apiClient et lu côté serveur.
    const { user, accessToken, refreshToken } = await googleLoginRequest(idToken);
    await saveTokens({ accessToken, refreshToken });
    await clearGuestToken();
    set({ status: 'authenticated', user });
    return true;
  },

  // Suppression de compte en libre-service (exigence Play Store) — à
  // l'inverse de logout(), on n'efface l'état local qu'après confirmation
  // serveur : un échec réseau ne doit pas laisser croire au compte supprimé
  // alors qu'il ne l'est pas.
  deleteAccount: async () => {
    await apiClient.delete('/auth/me');
    await clearTokens();
    set({ status: 'guest', user: null });
  },

  logout: async () => {
    const refreshToken = await getRefreshToken();
    await clearTokens();
    set({ status: 'guest', user: null });
    if (refreshToken) {
      // Best-effort : la session locale est déjà effacée quoi qu'il arrive,
      // la révocation serveur ne doit pas bloquer la déconnexion perçue.
      logoutRequest(refreshToken).catch(() => undefined);
    }
  },
}));

// Branché une seule fois : si le client API n'arrive plus à rafraîchir la
// session (refresh token expiré/révoqué), on retombe sur l'écran de connexion.
setOnAuthExpired(() => {
  useAuthStore.setState({ status: 'guest', user: null });
});
