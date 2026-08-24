import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'rabipek-guest-id';

// Identifiant purement local et cosmétique (affiché sur l'écran Compte pour
// un visiteur non connecté) — aucune valeur d'authentification, contrairement
// à l'id utilisateur renvoyé par le backend une fois le compte créé. Généré
// une seule fois par installation puis persisté, pour rester stable d'une
// session à l'autre tant que l'utilisateur ne se connecte pas.
export async function getOrCreateGuestId(): Promise<string> {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const generated = String(Math.floor(100000000 + Math.random() * 900000000));
  await AsyncStorage.setItem(STORAGE_KEY, generated);
  return generated;
}
