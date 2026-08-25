import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushToken, unregisterPushToken } from '../api/notifications';

// Persisté (pas seulement en mémoire) : permet de désenregistrer le bon
// jeton même après un redémarrage de l'app (ex. utilisateur qui désactive
// les notifications dans Réglages sans avoir rouvert /bonus depuis) — un
// simple cache mémoire ne survivrait pas à ce cas.
const STORED_TOKEN_KEY = 'rabipek-push-token';

// Notification reçue app au premier plan : affichée quand même (bannière +
// son) plutôt que silencieusement avalée — comportement attendu pour une
// relance check-in ou une réponse support pendant que l'app est ouverte.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// No-op sur simulateur/émulateur (aucun vrai jeton possible) et si la
// permission est refusée — demande passive (au démarrage, ou quand
// l'utilisateur réactive le switch dans Réglages), pas d'insistance ni de
// blocage du reste de l'app dans les deux cas.
export async function registerForPushNotifications(): Promise<void> {
  // Chaque sortie anticipée logge sa raison (console.warn) : le silence total
  // précédent rendait impossible de savoir, depuis les logs Metro/adb,
  // pourquoi aucun jeton n'atterrissait jamais côté serveur.
  if (!Device.isDevice) {
    console.warn('[push] annulé : simulateur/émulateur détecté (Device.isDevice === false)');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn(`[push] annulé : permission refusée (statut = ${finalStatus})`);
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Général',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    console.warn('[push] annulé : projectId introuvable dans app.config.ts (extra.eas.projectId)');
    return;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await AsyncStorage.setItem(STORED_TOKEN_KEY, token);
    await registerPushToken(token);
    console.log(`[push] jeton enregistré côté serveur : ${token}`);
  } catch (error) {
    // Hors-ligne, service Expo indisponible, ou échec de l'appel serveur
    // (401, réseau...) : on n'insiste pas ici, mais on logge pour diagnostiquer.
    console.warn('[push] échec de récupération/enregistrement du jeton :', error);
  }
}

// Appelé à la déconnexion ET quand l'utilisateur désactive le switch dans
// Réglages — dans les deux cas, on ne peut pas révoquer la permission OS
// depuis l'app, mais supprimer le jeton côté serveur suffit à ne plus jamais
// lui envoyer de push (cf. sendPushToUser, qui ne trouve alors plus rien).
export async function unregisterCurrentPushToken(): Promise<void> {
  const token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
  if (!token) return;
  await unregisterPushToken(token).catch(() => undefined);
  await AsyncStorage.removeItem(STORED_TOKEN_KEY);
}
