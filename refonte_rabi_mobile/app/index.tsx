import { Redirect } from 'expo-router';

// Un visiteur non connecté (statut 'guest') entre directement dans l'app,
// comme un utilisateur authentifié — cf. app/(app)/_layout.tsx pour le
// détail de ce qui reste ouvert sans compte. (auth)/login reste accessible
// depuis l'écran Compte via "S'identifier".
export default function Index() {
  return <Redirect href="/(app)" />;
}
