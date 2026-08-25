import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Alert, Pressable } from 'react-native';
import { useTheme } from '../../src/theme/useTheme';

// Stack racine de la zone "app" : héberge le groupe d'onglets `(tabs)`
// (accueil/bibliothèque/compte) et les écrans "poussés" par-dessus (fiche
// livre, lecteur, recherche) avec bouton retour natif. Plus de garde
// d'authentification ici : un visiteur non connecté (statut 'guest', cf.
// auth-store.ts) peut naviguer librement — parcourir le catalogue et lire les
// chapitres gratuits ne nécessite pas de compte. Les actions qui en ont
// vraiment besoin (achat, bibliothèque personnelle, commentaires) redirigent
// vers la connexion au moment où elles sont tentées, pas à l'entrée de l'app.
export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerBackTitle: '',
        // "ios_from_right" resolves to iOS's own native default there (donc
        // inchangé), mais donne à Android le même glissement — sans ça,
        // Android retombe sur une transition par défaut moins soignée pour
        // ces écrans "poussés" (fiche livre, recherche, paramètres...).
        animation: 'ios_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="book/[slug]" options={{ title: '' }} />
      {/* Fondu plutôt qu'un slide pour entrer dans la lecture immersive : se
          lit comme "on ouvre le livre", pas comme un simple écran de plus
          empilé par-dessus. */}
      <Stack.Screen name="book/[slug]/chapter/[chapterId]" options={{ title: '', animation: 'fade' }} />
      <Stack.Screen name="search" options={{ title: 'Recherche' }} />
      <Stack.Screen name="settings" options={{ title: 'Paramètres' }} />
      <Stack.Screen name="library" options={{ title: 'Bibliothèque' }} />
      <Stack.Screen name="history" options={{ title: 'Vu' }} />
      <Stack.Screen name="inbox" options={{ title: 'Boîte de réception' }} />
      <Stack.Screen
        name="bonus"
        options={{
          title: 'Gagner des bonus',
          headerRight: () => (
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Comment ça marche ?',
                  'Complétez des tâches (lecture, partage, vidéos) pour gagner des bonus, utilisables pour débloquer des chapitres.',
                )
              }
              hitSlop={10}
            >
              <Ionicons name="help-circle-outline" size={22} color={colors.ink} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="mentions-legales" options={{ title: 'Mentions légales' }} />
      <Stack.Screen name="cgv" options={{ title: 'CGV' }} />
      <Stack.Screen name="politique-confidentialite" options={{ title: 'Confidentialité' }} />
    </Stack>
  );
}
