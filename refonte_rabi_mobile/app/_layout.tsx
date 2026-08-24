import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { useAuthStore } from '../src/auth/auth-store';
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
  const { colors } = useTheme();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Une seule fois au démarrage — requis avant de charger/afficher la
  // moindre pub (cf. bonus.tsx pour la pub récompensée). ID de test pour
  // l'instant (cf. app.config.ts), donc échec silencieux acceptable ici.
  useEffect(() => {
    mobileAds()
      .initialize()
      .catch(() => undefined);
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
        <Image source={require('../assets/rabipek-logo.png')} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator color={colors.accent} size="small" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
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
