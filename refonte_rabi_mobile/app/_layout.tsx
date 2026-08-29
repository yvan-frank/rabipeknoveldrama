import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { useAuthStore } from '../src/auth/auth-store';
import { AppAlertHost } from '../src/components/AppAlert';
import { MarketingSplash } from '../src/components/MarketingSplash';
import { ToastHost } from '../src/components/Toast';
import { useNotificationPreferenceStore } from '../src/lib/notification-preference-store';
import { registerForPushNotifications, unregisterCurrentPushToken } from '../src/lib/push-notifications';
import { fontsToLoad } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

// Durée minimale du teaser marketing (cf. MarketingSplash) — l'app réelle
// (Stack ci-dessous) est déjà montée en arrière-plan pendant ce temps, donc
// le bootstrap auth tourne en parallèle plutôt qu'après ; si jamais il prend
// plus longtemps que 5s, le splash reste affiché jusqu'à ce qu'il termine
// (cf. appReady) au lieu de révéler un app pas encore prêt.
const MARKETING_SPLASH_MS = 5000;

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const [fontsLoaded] = useFonts(fontsToLoad);
  const { scheme } = useTheme();
  const notificationsEnabled = useNotificationPreferenceStore((state) => state.enabled);
  const [showMarketingSplash, setShowMarketingSplash] = useState(true);
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), MARKETING_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // Google exige la collecte du consentement (RGPD/DMA, User Messaging
  // Platform) AVANT toute requête de pub — mobileAds().initialize() ne doit
  // donc plus être appelé inconditionnellement. gatherConsent() affiche le
  // formulaire UMP si nécessaire (utilisateur EEE/UK non-EEE = no-op immédiat)
  // et canRequestAds ne devient vrai qu'une fois ce choix fait ou non requis.
  useEffect(() => {
    AdsConsent.gatherConsent()
      .catch(() => ({ canRequestAds: false }))
      .then(({ canRequestAds }) => {
        if (!canRequestAds) return;
        return mobileAds().initialize();
      })
      .catch(() => undefined);
  }, []);

  // Enregistrement passif du jeton push dès la connexion (cf.
  // src/lib/push-notifications.ts) — pas pour un visiteur, /notifications/*
  // exige une session comme le reste de l'API. Réagit aussi au switch de
  // Réglages (notificationsEnabled) : l'activer/désactiver là-bas déclenche
  // ici l'enregistrement ou la suppression réelle du jeton, sans logique
  // dupliquée côté écran Réglages.
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (notificationsEnabled) {
      registerForPushNotifications().catch(() => undefined);
    } else {
      unregisterCurrentPushToken().catch(() => undefined);
    }
  }, [status, notificationsEnabled]);

  // Tap sur une notification (app en arrière-plan ou fermée) : navigue vers
  // l'écran pertinent selon son type (cf. notifications.service.ts côté
  // serveur, qui pose `data.type` à l'envoi).
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const type = response.notification.request.content.data?.type;
      if (type === 'support-reply') {
        router.push('/inbox');
      } else if (type === 'checkin-reminder') {
        router.push('/bonus');
      }
    });
    return () => subscription.remove();
  }, []);

  // Le splash natif (logo nu, cf. app.config.ts) se masque dès que les
  // fonts sont prêtes, sans attendre bootstrap() : c'est MarketingSplash
  // ci-dessous qui prend le relais visuel immédiatement, lui-même monté par-
  // dessus l'app réelle (déjà en train de démarrer dessous) plutôt qu'à sa
  // place — d'où le crossfade en sortie au lieu d'un cut.
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Prêt = auth résolue ET durée minimale du teaser marketing écoulée ; si
  // bootstrap() traîne au-delà de 5s (réseau lent), le splash reste affiché
  // plutôt que de révéler un app encore en cours de résolution d'auth.
  const appReady = status !== 'bootstrapping' && minSplashElapsed;

  return (
    <QueryClientProvider client={queryClient}>
      {/* scheme est le thème EFFECTIF (préférence manuelle ou système, cf.
          useTheme) — pas le système brut, pour rester cohérent avec un
          utilisateur qui a forcé un mode dans Réglages à l'inverse du système.
          Forcé en clair ("light") tant que le splash marketing (fond sombre)
          recouvre l'écran. */}
      <StatusBar style={showMarketingSplash ? 'light' : scheme === 'dark' ? 'light' : 'dark'} />
      {/* "fade" ici plutôt qu'un slide : le seul passage géré à ce niveau est
          (auth) <-> (app), un changement de contexte complet (visiteur/connecté),
          pas un "empilement" d'écran — un fondu se lit mieux qu'un glissement. */}
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      {/* Monté une seule fois ici : showAlert() (cf. src/components/AppAlert.tsx)
          fonctionne depuis n'importe quel écran de l'app, pas seulement ceux
          sous ce layout racine. */}
      <AppAlertHost />
      <ToastHost />
      {showMarketingSplash ? (
        <MarketingSplash ready={appReady} onFinished={() => setShowMarketingSplash(false)} />
      ) : null}
    </QueryClientProvider>
  );
}
