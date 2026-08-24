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
  name: APP_ENV === 'prod' ? 'RabipekNovel' : `Rabipek (${APP_ENV})`,
  slug: 'rabipek',
  scheme: 'rabipek',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.frank00.rabipek",
  },
  android: {
    package: "com.frank00.rabipek",
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
      // play-services-ads 25.4.0 (tirée par react-native-google-mobile-ads)
      // est compilée avec des métadonnées Kotlin en version binaire 2.3.0,
      // incompatibles avec le Kotlin 2.1.20 par défaut du SDK Expo 57 —
      // `compileDebugKotlin` échouait avec "Module was compiled with an
      // incompatible version of Kotlin. The binary version of its metadata
      // is 2.3.0, expected version is 2.1.0." Ce plugin force un Kotlin plus
      // récent, capable de lire ces métadonnées.
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
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-6638210178103357~3386330759',
        iosAppId: 'ca-app-pub-3940256099942544~1458002511',
      },
    ],
  ],
  extra: {
    appEnv: APP_ENV,
    apiUrl: API_URL_BY_ENV[APP_ENV] ?? API_URL_BY_ENV.dev,
      "eas": {
          "projectId": "f0ab758c-40a7-42da-913c-d81048cf5694"
      }
  },
};

export default config;
