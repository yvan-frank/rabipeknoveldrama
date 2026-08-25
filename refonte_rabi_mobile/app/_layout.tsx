import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { useAuthStore } from '../src/auth/auth-store';
import { useNotificationPreferenceStore } from '../src/lib/notification-preference-store';
import { registerForPushNotifications, unregisterCurrentPushToken } from '../src/lib/push-notifications';
import { fontsToLoad } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const [fontsLoaded] = useFonts(fontsToLoad);
  const { colors, scheme } = useTheme();
  const notificationsEnabled = useNotificationPreferenceStore((state) => state.enabled);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

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

  // hideAsync() est un no-op si le splash est déjà masqué : pas besoin d'état
  // supplémentaire pour éviter les appels répétés (ex. authenticated -> guest).
  useEffect(() => {
    if (status !== 'bootstrapping' && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [status, fontsLoaded]);

  if (status === 'bootstrapping' || !fontsLoaded) {
    // Même logo/fond que le splash natif configuré (cf. app.config.ts) : le
    // passage de l'un à l'autre (hideAsync) reste invisible, sans flash de
    // fond blanc/spinner nu entre les deux.
    return (
      <View style={[styles.loading, { backgroundColor: '#FBF7EE' }]}>
        {/* Fond du splash toujours clair (cf. commentaire ci-dessus), donc
            icônes de statusbar toujours sombres ici, indépendamment du thème
            — bascule sur le thème effectif seulement une fois l'app affichée. */}
        <StatusBar style="dark" />
        <Image source={require('../assets/rabipek-logo.png')} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator color={colors.accent} size="small" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* scheme est le thème EFFECTIF (préférence manuelle ou système, cf.
          useTheme) — pas le système brut, pour rester cohérent avec un
          utilisateur qui a forcé un mode dans Réglages à l'inverse du système. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* "fade" ici plutôt qu'un slide : le seul passage géré à ce niveau est
          (auth) <-> (app), un changement de contexte complet (visiteur/connecté),
          pas un "empilement" d'écran — un fondu se lit mieux qu'un glissement. */}
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 220, height: 220 },
});
