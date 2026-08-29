import type { ExpoConfig } from 'expo/config';

// APP_ENV distingue les profils de build EAS (dev/staging/prod) — chacun
// pointe vers une API différente. `expo start` local retombe sur `dev`.
// cf. src/config/env.ts pour la lecture côté app via expo-constants.
const APP_ENV = process.env.APP_ENV ?? 'dev';

// refonte_server monte toutes ses routes sous /api (cf. app.use('/api', router)
// dans refonte_server/src/app.ts) — le web le sait déjà (NEXT_PUBLIC_API_URL
// se termine par /api), l'URL par défaut ici doit faire pareil.
const API_URL_BY_ENV: Record<string, string> = {
  dev: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  staging: process.env.EXPO_PUBLIC_API_URL ?? 'https://staging-api.rabipeknovel.com/api',
  prod: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.rabipeknovel.com/api',
};

const config: ExpoConfig = {
  name: "RabipekNovel",
  slug: 'rabipek',
  scheme: 'rabipek',
  version: '2.7.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.frank00.rabipek",
  },
  android: {
    package: "com.frank00.rabipek",
      versionCode: 18,
    // Requis pour les notifications push (FCM v1) depuis qu'Expo route les
    // push Android via Firebase Cloud Messaging plutôt que son propre relais
    // — sans ce fichier, getExpoPushTokenAsync() échoue avec "Default
    // FirebaseApp is not initialized" (cf. push-notifications.ts).
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#10161F',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-build-properties',
      { android: { kotlinVersion: '2.2.20' } },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/rabipek-logo.png',
        imageWidth: 220,
        resizeMode: 'contain',
        backgroundColor: '#FBF7EE',
      },
    ],
    'expo-sharing',
    [
      // Requis pour ImagePicker.launchImageLibraryAsync (couverture de livre,
      // pièce d'identité KYC — cf. src/api/authors.ts) : sans ce plugin, iOS
      // n'a pas de texte de permission (NSPhotoLibraryUsageDescription) et
      // rejette l'accès à la photothèque plutôt que de simplement demander.
      'expo-image-picker',
      {
        photosPermission: "Rabipek a besoin d'accéder à vos photos pour choisir une couverture ou une pièce d'identité.",
      },
    ],
    [
      'expo-notifications',
      {
        // Icône monochrome dédiée (obligatoire Android 13+, sinon l'icône
        // de l'app entière est utilisée en fallback dégradé) — même image
        // que l'icône adaptive Android déjà déclarée ci-dessus.
        icon: './assets/android-icon-monochrome.png',
        color: '#F59E0B',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-6638210178103357~3386330759',
        iosAppId: 'ca-app-pub-3940256099942544~1458002511',
      },
    ],
    // Android : résolu automatiquement via google-services.json (déjà
    // présent pour les push FCM). iOS : nécessiterait un `iosUrlScheme`
    // dérivé d'un client OAuth iOS dédié — pas encore créé (app pas publiée
    // sur l'App Store, cf. APP_STORE_URL vide), Google Sign-In reste donc
    // Android-only tant qu'il n'existe pas.
    '@react-native-google-signin/google-signin',
  ],
  extra: {
    appEnv: APP_ENV,
    apiUrl: 'https://api.rabipeknovel.com/api',
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
      "eas": {
          "projectId": "f0ab758c-40a7-42da-913c-d81048cf5694"
      }
  },
};

export default config;
