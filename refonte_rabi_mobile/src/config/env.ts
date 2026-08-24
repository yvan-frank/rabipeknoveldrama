import Constants from 'expo-constants';

interface AppExtra {
  appEnv: string;
  apiUrl: string;
}

const extra = Constants.expoConfig?.extra as AppExtra | undefined;

if (!extra?.apiUrl) {
  throw new Error('apiUrl manquant dans app.config.ts extra — vérifiez EXPO_PUBLIC_API_URL');
}

export const env = {
  APP_ENV: extra.appEnv,
  API_URL: extra.apiUrl,
};
